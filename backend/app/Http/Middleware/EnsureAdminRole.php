<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminRole
{
    /** @var list<string> */
    private const ADMIN_ROLES = ['super_admin', 'store_manager', 'admin'];

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            $request->user()
                && in_array($request->user()->role, self::ADMIN_ROLES, true),
            Response::HTTP_FORBIDDEN,
        );

        return $next($request);
    }
}
