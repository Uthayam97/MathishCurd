/** User entity matching the JSON Server /users endpoint */
export interface User {
  id?: number;
  name: string;
  email: string;
  contact: string;
  address: string;
}
