<?php

namespace App\Http\Resources\ProductReview;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductReviewResource extends JsonResource
{
    /** @var list<string> */
    private const ADMIN_ROLES = ['super_admin', 'store_manager', 'admin'];

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isOwner = $user && $user->getKey() === $this->user_id;
        $isAdmin = $user && in_array($user->role, self::ADMIN_ROLES, true);
        $canViewPrivateFields = $isOwner || $isAdmin;

        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'title' => $this->title,
            'comment' => $this->comment,
            'status' => $this->when($canViewPrivateFields, $this->status),
            'is_verified_purchase' => $this->is_verified_purchase,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'approved_at' => $this->approved_at?->toISOString(),
            'rejected_at' => $this->when(
                $canViewPrivateFields,
                $this->rejected_at?->toISOString(),
            ),
            'customer' => $this->whenLoaded('user', fn (): array => [
                'name' => $this->user->name,
            ]),
            'product' => $this->whenLoaded('product', fn (): array => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'slug' => $this->product->slug,
            ]),
            'moderation_note' => $this->when(
                $canViewPrivateFields,
                $this->moderation_note,
            ),
            'moderator' => $this->when(
                $isAdmin && $this->relationLoaded('moderator'),
                fn (): ?array => $this->moderator ? [
                    'id' => $this->moderator->id,
                    'name' => $this->moderator->name,
                ] : null,
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
