<?php

use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\AppHomeController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SalesController;
use App\Http\Controllers\Admin\SiteController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\DebugController;
use App\Http\Controllers\Repairs\PublicTrackingController;
use App\Http\Controllers\Repairs\TechAuthController;
use App\Http\Controllers\Repairs\WorkbenchController;
use App\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StoreController::class, 'home'])->name('home');
Route::get('/productos', [StoreController::class, 'catalog'])->name('store.catalog');
Route::get('/productos-preview', [StoreController::class, 'catalog'])->name('store.catalog.preview');
Route::get('/producto/{slug}', [StoreController::class, 'show'])->name('store.product.show');
Route::get('/servicios', [StoreController::class, 'services'])->name('store.services');
Route::get('/carrito', [StoreController::class, 'cart'])->name('store.cart');

Route::post('/carrito/agregar', [CartController::class, 'add'])->name('cart.add');
Route::post('/carrito/actualizar', [CartController::class, 'update'])->name('cart.update');
Route::post('/carrito/eliminar', [CartController::class, 'remove'])->name('cart.remove');
Route::post('/carrito/vaciar', [CartController::class, 'clear'])->name('cart.clear');

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::match(['get', 'post'], '/reparacion', PublicTrackingController::class)->name('repairs.tracking');
Route::match(['get', 'post'], '/reparación', PublicTrackingController::class);
Route::match(['get', 'post'], '/reparacion.php', PublicTrackingController::class);
Route::match(['get', 'post'], '/reparaciones', PublicTrackingController::class);
Route::match(['get', 'post'], '/reparaciones.php', PublicTrackingController::class);

Route::get('/salir-tecnico', [TechAuthController::class, 'logout'])->name('repairs.logout');
Route::get('/logout.php', [TechAuthController::class, 'logout']);

Route::get('/consulta', [WorkbenchController::class, 'consultations'])->name('repairs.workbench');
Route::post('/consulta', [TechAuthController::class, 'login'])->name('repairs.login.submit');
Route::get('/consulta.php', [WorkbenchController::class, 'consultations']);
Route::post('/consulta.php', [TechAuthController::class, 'login']);

Route::middleware(['repair.tech'])->group(function (): void {
    Route::get('/ingreso', [WorkbenchController::class, 'index'])->name('repairs.ingress');
    Route::post('/ingreso', [WorkbenchController::class, 'store'])->name('repairs.orders.store');
    Route::get('/ingreso.php', [WorkbenchController::class, 'index']);
    Route::post('/ingreso.php', [WorkbenchController::class, 'store']);
    Route::get('/repairs/tickets/{orderId}', [WorkbenchController::class, 'showTicket'])->name('repairs.tickets.show');
    Route::get('/consulta/ticket/{orderId}', [WorkbenchController::class, 'showTicket']);
    Route::get('/entregados', [WorkbenchController::class, 'delivered'])->name('repairs.delivered');
    Route::get('/entregados.php', [WorkbenchController::class, 'delivered']);
    Route::get('/metricas', [WorkbenchController::class, 'metrics'])->name('repairs.metrics');
    Route::get('/repuestos', [WorkbenchController::class, 'parts'])->name('repairs.parts');
    Route::get('/repuestos.php', [WorkbenchController::class, 'parts']);
    Route::post('/repairs/parts/inventory', [WorkbenchController::class, 'storePartInventory'])->name('repairs.parts.inventory.store');
    Route::post('/repairs/parts/boxes', [WorkbenchController::class, 'storePartBox'])->name('repairs.parts.boxes.store');
    Route::post('/repairs/parts/inventory/{repairPart}', [WorkbenchController::class, 'updatePartInventory'])->name('repairs.parts.inventory.update');
    Route::post('/repairs/parts/inventory/{repairPart}/delete', [WorkbenchController::class, 'destroyPartInventory'])->name('repairs.parts.inventory.delete');
    Route::post('/repairs/orders/{repairOrder}/parts/remove', [WorkbenchController::class, 'removePartRequest'])->name('repairs.parts.remove');
    Route::get('/repairs/api/client/by-dni', [WorkbenchController::class, 'lookupByDni'])->name('repairs.lookup');
    Route::post('/repairs/orders/{repairOrder}', [WorkbenchController::class, 'update'])->name('repairs.orders.update');
    Route::post('/repairs/orders/{repairOrder}/payments', [WorkbenchController::class, 'addPayment'])->name('repairs.orders.payments.store');
    Route::post('/repairs/orders/{repairOrder}/payments/{repairPayment}/delete', [WorkbenchController::class, 'deletePayment'])->name('repairs.orders.payments.delete');
    Route::post('/repairs/orders/{repairOrder}/state', [WorkbenchController::class, 'updateState'])->name('repairs.orders.state');
    Route::post('/repairs/orders/{repairOrder}/add-repair', [WorkbenchController::class, 'addRepair'])->name('repairs.orders.add_repair');
    Route::post('/repairs/orders/{repairOrder}/images/add', [WorkbenchController::class, 'addOriginalImages'])->name('repairs.orders.images.add');
    Route::post('/repairs/orders/{repairOrder}/images/remove', [WorkbenchController::class, 'removeOriginalImage'])->name('repairs.orders.images.remove');
    Route::post('/repairs/orders/{repairOrder}/final-images/add', [WorkbenchController::class, 'addFinalImages'])->name('repairs.orders.final_images.add');
    Route::post('/repairs/orders/{repairOrder}/final-images/remove', [WorkbenchController::class, 'removeFinalImage'])->name('repairs.orders.final_images.remove');
    Route::post('/repairs/orders/{repairOrder}/deliver', [WorkbenchController::class, 'deliver'])->name('repairs.orders.deliver');
    Route::post('/repairs/orders/{repairOrder}/mark-ready', [WorkbenchController::class, 'markReady'])->name('repairs.orders.mark_ready');
    Route::post('/repairs/orders/{repairOrder}/cancel', [WorkbenchController::class, 'cancel'])->name('repairs.orders.cancel');
    Route::post('/repairs/orders/{repairOrder}/move-back', [WorkbenchController::class, 'moveBack'])->name('repairs.orders.move_back');
    Route::post('/repairs/orders/{repairOrder}/delete', [WorkbenchController::class, 'destroy'])->name('repairs.orders.delete');
});

Route::middleware(['auth', 'role:admin,editor'])->group(function (): void {
    Route::get('/admin', AppHomeController::class)->name('admin.app');
    Route::get('/admin/panel', DashboardController::class)->name('admin.dashboard');

    Route::get('/admin/anuncios', [SiteController::class, 'announcements'])->name('admin.announcements.index');
    Route::post('/admin/anuncios/guardar', [SiteController::class, 'saveAnnouncements'])->name('admin.announcements.save');

    Route::get('/admin/contacto', [SiteController::class, 'contact'])->name('admin.contact.index');
    Route::post('/admin/contacto/guardar', [SiteController::class, 'saveContact'])->name('admin.contact.save');

    Route::get('/admin/configuracion', [SiteController::class, 'settings'])->name('admin.settings.index');
    Route::post('/admin/configuracion/guardar', [SiteController::class, 'saveSettings'])->name('admin.settings.save');
    Route::post('/admin/configuracion/limpiar-cache', [SiteController::class, 'clearCache'])->name('admin.settings.clear_cache');

    Route::get('/admin/servicios', [SiteController::class, 'services'])->name('admin.services.index');
    Route::post('/admin/servicios/guardar', [SiteController::class, 'saveServices'])->name('admin.services.save');

    Route::get('/admin/categorias', [CategoryController::class, 'index'])->name('admin.categories.index');
    Route::post('/admin/categorias/guardar', [CategoryController::class, 'store'])->name('admin.categories.store');
    Route::post('/admin/categorias/grupos/guardar', [CategoryController::class, 'store']);
    Route::post('/admin/categorias/actualizar/{category}', [CategoryController::class, 'update'])->name('admin.categories.update');
    Route::post('/admin/categorias/visibilidad/{category}', [CategoryController::class, 'toggleVisibility'])->name('admin.categories.visibility');
    Route::post('/admin/categorias/reordenar', [CategoryController::class, 'reorder'])->name('admin.categories.reorder');
    Route::post('/admin/categorias/fusionar', [CategoryController::class, 'merge'])->name('admin.categories.merge');
    Route::post('/admin/categorias/eliminar/{category}', [CategoryController::class, 'destroy'])->name('admin.categories.destroy');

    Route::get('/admin/productos', [ProductController::class, 'index'])->name('admin.products.index');
    Route::get('/admin/productos/imagenes-faltantes', [ProductController::class, 'index'])->name('admin.products.missing_images');
    Route::get('/admin/productos/skus-faltantes', [ProductController::class, 'index'])->name('admin.products.missing_sku');
    Route::get('/admin/productos/nuevo', [ProductController::class, 'create'])->name('admin.products.create');
    Route::post('/admin/productos/guardar', [ProductController::class, 'store'])->name('admin.products.store');
    Route::post('/admin/productos/guardar-rapido', [ProductController::class, 'quickStore'])->name('admin.products.quick_store');
    Route::post('/admin/productos/rotacion-imagen/guardar', [ProductController::class, 'saveRotation'])->name('admin.products.rotation.save');
    Route::get('/admin/productos/editar/{product}', [ProductController::class, 'edit'])->name('admin.products.edit');
    Route::post('/admin/productos/imagenes-faltantes/guardar/{product}', [ProductController::class, 'update']);
    Route::post('/admin/productos/quick-update/{product}', [ProductController::class, 'quickUpdate'])->name('admin.products.quick_update');
    Route::post('/admin/productos/actualizar/{product}', [ProductController::class, 'update'])->name('admin.products.update');
    Route::post('/admin/productos/eliminar/{product}', [ProductController::class, 'destroy'])->name('admin.products.destroy');
    Route::post('/admin/productos/duplicar/{product}', [ProductController::class, 'duplicate'])->name('admin.products.duplicate');
    Route::post('/admin/productos/masivo', [ProductController::class, 'bulkUpdate'])->name('admin.products.bulk');

    Route::get('/admin/listados', [SiteController::class, 'listados'])->name('admin.listados.index');
    Route::get('/admin/listados/imprimir', [SiteController::class, 'listadosPrint'])->name('admin.listados.print');
    Route::get('/admin/listados/thumb', [SiteController::class, 'listadosThumb'])->name('admin.listados.thumb');

    Route::get('/admin/ventas', [SalesController::class, 'index'])->name('admin.sales.index');
    Route::get('/admin/ventas/nueva', [SalesController::class, 'create'])->name('admin.sales.create');
    Route::get('/admin/ventas/ticket/{sale}', [SalesController::class, 'ticket'])->name('admin.sales.ticket');
    Route::get('/admin/api/ventas', [SalesController::class, 'apiIndex'])->name('admin.api.sales.index');
    Route::get('/admin/api/ventas/productos', [SalesController::class, 'apiProducts'])->name('admin.api.sales.products');
    Route::get('/admin/api/ventas/{sale}', [SalesController::class, 'apiShow'])->name('admin.api.sales.show');
    Route::post('/admin/api/ventas', [SalesController::class, 'apiStore'])->name('admin.api.sales.store');
    Route::post('/admin/api/ventas/{sale}/delete', [SalesController::class, 'apiDelete'])->name('admin.api.sales.delete');

    Route::get('/admin/media', [MediaController::class, 'index'])->name('admin.media.index');
    Route::post('/admin/media/subir', [MediaController::class, 'upload'])->name('admin.media.upload');
    Route::post('/admin/media/eliminar/{media}', [MediaController::class, 'destroy'])->name('admin.media.destroy');

    Route::get('/admin/backups', [BackupController::class, 'index'])->name('admin.backups.index');
    Route::post('/admin/backups/crear', [BackupController::class, 'create'])->name('admin.backups.create');
    Route::post('/admin/backups/restaurar', [BackupController::class, 'restore'])->name('admin.backups.restore');
    Route::post('/admin/backups/eliminar/{file}', [BackupController::class, 'delete'])->name('admin.backups.delete');
    Route::get('/admin/backups/descargar/{file}', [BackupController::class, 'download'])->name('admin.backups.download');

    Route::get('/admin/papelera', [SiteController::class, 'trash'])->name('admin.trash.index');
    Route::post('/admin/papelera/producto/restaurar/{id}', [SiteController::class, 'restoreProduct'])->name('admin.trash.product.restore');
    Route::post('/admin/papelera/producto/eliminar/{id}', [SiteController::class, 'forceDeleteProduct'])->name('admin.trash.product.delete');
    Route::post('/admin/papelera/categoria/restaurar/{id}', [SiteController::class, 'restoreCategory'])->name('admin.trash.category.restore');
    Route::post('/admin/papelera/categoria/eliminar/{id}', [SiteController::class, 'forceDeleteCategory'])->name('admin.trash.category.delete');
});

Route::get('/debug/runtime', [DebugController::class, 'runtime']);
Route::get('/debug/db', [DebugController::class, 'database']);
Route::get('/debug/logs', [DebugController::class, 'logs']);
Route::get('/debug/repairs', [DebugController::class, 'repairs']);
Route::get('/debug/badges', [DebugController::class, 'badgePreview']);
