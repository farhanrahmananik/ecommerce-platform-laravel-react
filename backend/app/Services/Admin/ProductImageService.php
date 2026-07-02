<?php

namespace App\Services\Admin;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class ProductImageService
{
    /**
     * Get a product's images in stable display order.
     *
     * @return Collection<int, ProductImage>
     */
    public function list(Product $product): Collection
    {
        return $product->images()->get();
    }

    /**
     * Store an uploaded product image and its metadata.
     *
     * @param  array<string, mixed>  $data
     */
    public function upload(Product $product, array $data): ProductImage
    {
        /** @var UploadedFile $image */
        $image = $data['image'];
        $filename = Str::uuid()->toString().'.'.$image->extension();
        $imagePath = $image->storeAs(
            "product-images/{$product->getKey()}",
            $filename,
            'public',
        );

        if (! is_string($imagePath)) {
            throw new RuntimeException('The product image could not be stored.');
        }

        try {
            return DB::transaction(function () use ($data, $image, $imagePath, $product): ProductImage {
                Product::query()
                    ->whereKey($product->getKey())
                    ->lockForUpdate()
                    ->firstOrFail();

                $isFirstImage = ! ProductImage::query()
                    ->where('product_id', $product->getKey())
                    ->exists();
                $isPrimary = $isFirstImage || $this->booleanValue($data['is_primary'] ?? false);

                if ($isPrimary) {
                    ProductImage::query()
                        ->where('product_id', $product->getKey())
                        ->update(['is_primary' => false]);
                }

                return ProductImage::query()->create([
                    'product_id' => $product->getKey(),
                    'image_path' => $imagePath,
                    'original_name' => $image->getClientOriginalName(),
                    'mime_type' => $image->getMimeType() ?: null,
                    'size_bytes' => $image->getSize() ?: 0,
                    'alt_text' => $data['alt_text'] ?? null,
                    'is_primary' => $isPrimary,
                    'sort_order' => $data['sort_order'] ?? 0,
                ]);
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($imagePath);

            throw $exception;
        }
    }

    /**
     * Update editable image metadata.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(
        Product $product,
        ProductImage $productImage,
        array $data,
    ): ProductImage {
        $this->ensureBelongsToProduct($product, $productImage);

        return DB::transaction(function () use ($data, $product, $productImage): ProductImage {
            Product::query()
                ->whereKey($product->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $lockedImage = ProductImage::query()
                ->whereKey($productImage->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureBelongsToProduct($product, $lockedImage);

            $attributes = array_intersect_key($data, array_flip([
                'alt_text',
                'is_primary',
                'sort_order',
            ]));

            if (($attributes['is_primary'] ?? null) === null) {
                unset($attributes['is_primary']);
            } else {
                $attributes['is_primary'] = $this->booleanValue($attributes['is_primary']);
            }

            if (($attributes['sort_order'] ?? null) === null) {
                unset($attributes['sort_order']);
            }

            if (($attributes['is_primary'] ?? false) === true) {
                ProductImage::query()
                    ->where('product_id', $product->getKey())
                    ->whereKeyNot($lockedImage->getKey())
                    ->update(['is_primary' => false]);
            }

            $lockedImage->update($attributes);

            return $lockedImage->refresh();
        });
    }

    /**
     * Delete an image and promote the next image when required.
     */
    public function delete(Product $product, ProductImage $productImage): void
    {
        $this->ensureBelongsToProduct($product, $productImage);
        $imagePath = $productImage->image_path;

        DB::transaction(function () use ($product, $productImage): void {
            Product::query()
                ->whereKey($product->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $lockedImage = ProductImage::query()
                ->whereKey($productImage->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureBelongsToProduct($product, $lockedImage);
            $wasPrimary = $lockedImage->is_primary;

            $lockedImage->delete();

            if ($wasPrimary) {
                ProductImage::query()
                    ->where('product_id', $product->getKey())
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->first()
                    ?->update(['is_primary' => true]);
            }
        });

        Storage::disk('public')->delete($imagePath);
    }

    private function ensureBelongsToProduct(
        Product $product,
        ProductImage $productImage,
    ): void {
        abort_unless(
            (int) $productImage->product_id === (int) $product->getKey(),
            404,
        );
    }

    private function booleanValue(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOL);
    }
}
