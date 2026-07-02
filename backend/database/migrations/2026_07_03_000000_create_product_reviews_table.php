<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('title', 150)->nullable();
            $table->text('comment');
            $table->string('status')->default('pending');
            $table->boolean('is_verified_purchase')->default(false);
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->foreignId('moderated_by_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->text('moderation_note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['product_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['rating', 'status']);

            // A nullable deleted_at unique index permits multiple active rows
            // in MySQL. The service locks the user and enforces one active
            // review per user/product transactionally instead.
            $table->index(['user_id', 'product_id', 'deleted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
