<?php

namespace App\Http\Resources\ProductReview;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductReviewSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'average_rating' => $this->resource['average_rating'],
            'review_count' => $this->resource['review_count'],
            'rating_breakdown' => $this->resource['rating_breakdown'],
        ];
    }
}
