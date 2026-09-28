import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

export const supabaseAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!/\/api\/admin(?:\/|$)/.test(request.url)) return next(request);

  return from(inject(AdminAuthService).getAccessToken()).pipe(
    switchMap((accessToken) =>
      accessToken
        ? next(request.clone({ setHeaders: { Authorization: 'Bearer ' + accessToken } }))
        : next(request),
    ),
  );
};
