<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('wp_term_id')->nullable()->unique();
            $table->unsignedInteger('parent_wp_term_id')->nullable();
            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            $table->text('description')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->string('group_key', 32)->default('electronica');
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_hidden')->default(false);
            $table->softDeletes();
            $table->timestamps();
            $table->index(['group_key', 'sort_order']);
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('wp_product_id')->nullable()->unique();
            $table->unsignedInteger('category_id');
            $table->string('name', 160);
            $table->string('slug', 180)->unique();
            $table->string('permalink', 500)->nullable();
            $table->string('sku', 120)->nullable();
            $table->text('short_description')->nullable();
            $table->text('description')->nullable();
            $table->integer('price')->default(0);
            $table->integer('offer_price')->nullable();
            $table->dateTime('offer_start_at')->nullable();
            $table->dateTime('offer_end_at')->nullable();
            $table->bigInteger('raw_price_minor')->nullable();
            $table->string('currency_code', 10)->nullable();
            $table->integer('stock')->default(0);
            $table->string('stock_status', 20)->default('instock');
            $table->string('image_url', 500)->nullable();
            $table->string('image_url_2', 500)->nullable();
            $table->string('image_url_3', 500)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
            $table->index(['category_id', 'deleted_at']);
            $table->index(['created_at', 'is_featured']);
        });

        Schema::create('site_announcements', function (Blueprint $table): void {
            $table->unsignedInteger('id')->primary();
            $table->string('message', 255);
            $table->string('link_url', 500)->default('');
            $table->string('display_type', 16)->default('text');
            $table->string('image_url', 500)->nullable();
            $table->string('mobile_image_url', 500)->nullable();
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('site_announcement_config', function (Blueprint $table): void {
            $table->unsignedInteger('id')->primary();
            $table->unsignedInteger('rotation_ms')->default(4300);
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('site_contact_config', function (Blueprint $table): void {
            $table->unsignedInteger('id')->primary();
            $table->string('whatsapp_number', 20);
            $table->string('contact_title', 120)->default('Contactanos');
            $table->text('contact_description')->nullable();
            $table->string('contact_email', 180)->nullable();
            $table->string('maps_embed_url', 500)->nullable();
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('site_services', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('title', 150);
            $table->string('subtitle', 255)->nullable();
            $table->text('description')->nullable();
            $table->text('points_text')->nullable();
            $table->string('image_url', 500)->nullable();
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('site_services_config', function (Blueprint $table): void {
            $table->unsignedInteger('id')->primary();
            $table->string('hero_eyebrow', 120)->default('SERVICIOS');
            $table->string('hero_title', 255)->default('Soluciones para tu tienda');
            $table->text('hero_description')->nullable();
            $table->string('cta_title', 255)->default('Necesitas ayuda?');
            $table->text('cta_description')->nullable();
            $table->string('cta_whatsapp_text', 120)->nullable();
            $table->string('cta_repair_text', 120)->nullable();
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('site_global_config', function (Blueprint $table): void {
            $table->string('config_key', 100)->primary();
            $table->text('config_value')->nullable();
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('media_library', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('title', 180);
            $table->string('file_url', 500);
            $table->string('tags', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedInteger('file_size')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamps();
        });

        Schema::create('auth_login_rate_limits', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('rate_key', 190)->unique();
            $table->unsignedInteger('attempts')->default(0);
            $table->dateTime('blocked_until')->nullable();
            $table->dateTime('last_attempt_at')->nullable();
            $table->timestamps();
        });

        Schema::create('pages', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('wp_page_id')->unique();
            $table->string('title', 255);
            $table->string('slug', 200)->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('status', 30)->default('publish');
            $table->string('source_url', 500)->nullable();
            $table->dateTime('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('posts', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('wp_post_id')->unique();
            $table->string('title', 255);
            $table->string('slug', 200)->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('status', 30)->default('publish');
            $table->string('source_url', 500)->nullable();
            $table->dateTime('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('customer_name', 160);
            $table->string('customer_email', 180);
            $table->string('customer_phone', 60)->nullable();
            $table->string('status', 20)->default('pending');
            $table->integer('total')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable()->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('order_id');
            $table->unsignedInteger('product_id')->nullable();
            $table->integer('quantity')->default(1);
            $table->integer('unit_price')->default(0);
            $table->integer('subtotal')->default(0);
            $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
        });

        Schema::create('sales', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('ticket_number')->unique();
            $table->string('customer_label', 160)->default('Consumidor final');
            $table->dateTime('issued_at');
            $table->integer('subtotal')->default(0);
            $table->integer('total')->default(0);
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by_user_id')->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->foreign('created_by_user_id')->references('id')->on('users')->nullOnDelete();
            $table->index('issued_at');
        });

        Schema::create('sale_items', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('sale_id');
            $table->unsignedInteger('product_id')->nullable();
            $table->string('product_name_snapshot', 160);
            $table->string('product_sku_snapshot', 120)->nullable();
            $table->integer('quantity')->default(1);
            $table->integer('unit_price')->default(0);
            $table->integer('line_total')->default(0);
            $table->foreign('sale_id')->references('id')->on('sales')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
            $table->index('sale_id');
        });

        Schema::create('ordenes', function (Blueprint $table): void {
            $table->increments('registro_id');
            $table->unsignedInteger('id');
            $table->unsignedInteger('reparacion')->default(1);
            $table->date('fecha')->nullable();
            $table->string('nombre_cliente', 160);
            $table->unsignedInteger('dni')->default(12345678);
            $table->string('contacto', 160)->nullable();
            $table->string('modelo', 255)->nullable();
            $table->text('descripcion')->nullable();
            $table->text('observaciones')->nullable();
            $table->decimal('monto', 10, 2)->default(0);
            $table->decimal('senia', 10, 2)->default(0);
            $table->date('fecha_estimada')->nullable();
            $table->string('estado', 80)->default('PENDIENTE');
            $table->string('entregado', 5)->default('no');
            $table->date('fecha_entregado')->nullable();
            $table->text('garantia_motivo')->nullable();
            $table->string('imagen', 500)->nullable();
            $table->string('imagen3', 500)->nullable();
            $table->string('imagen4', 500)->nullable();
            $table->string('repuesto', 255)->nullable();
            $table->unsignedInteger('categorias_reparacion')->default(4);
            $table->timestamps();
            $table->unique(['id', 'reparacion']);
            $table->index(['dni', 'id']);
            $table->index(['entregado', 'estado']);
        });

        Schema::create('orden_eventos', function (Blueprint $table): void {
            $table->increments('id');
            $table->unsignedInteger('orden_id');
            $table->unsignedInteger('reparacion')->default(1);
            $table->string('usuario', 120)->default('sistema');
            $table->string('evento', 120);
            $table->text('detalle')->nullable();
            $table->string('estado_anterior', 120)->nullable();
            $table->string('estado_nuevo', 120)->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->index(['orden_id', 'reparacion', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orden_eventos');
        Schema::dropIfExists('ordenes');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('auth_login_rate_limits');
        Schema::dropIfExists('media_library');
        Schema::dropIfExists('site_global_config');
        Schema::dropIfExists('site_services_config');
        Schema::dropIfExists('site_services');
        Schema::dropIfExists('site_contact_config');
        Schema::dropIfExists('site_announcement_config');
        Schema::dropIfExists('site_announcements');
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
