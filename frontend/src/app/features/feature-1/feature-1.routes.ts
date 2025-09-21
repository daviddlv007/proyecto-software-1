import { Routes } from '@angular/router';


import { UserListPage } from './pages/User/User.list.page';
import { UserCreatePage } from './pages/User/User.create.page';
import { UserEditPage } from './pages/User/User.edit.page';

import { ProfileListPage } from './pages/Profile/Profile.list.page';
import { ProfileCreatePage } from './pages/Profile/Profile.create.page';
import { ProfileEditPage } from './pages/Profile/Profile.edit.page';

import { ProductListPage } from './pages/Product/Product.list.page';
import { ProductCreatePage } from './pages/Product/Product.create.page';
import { ProductEditPage } from './pages/Product/Product.edit.page';


export const featureRoutes: Routes = [

  { path: 'user', component: UserListPage },
  { path: 'user/create', component: UserCreatePage },
  { path: 'user/edit/:id', component: UserEditPage },

  { path: 'profile', component: ProfileListPage },
  { path: 'profile/create', component: ProfileCreatePage },
  { path: 'profile/edit/:id', component: ProfileEditPage },

  { path: 'product', component: ProductListPage },
  { path: 'product/create', component: ProductCreatePage },
  { path: 'product/edit/:id', component: ProductEditPage },

];