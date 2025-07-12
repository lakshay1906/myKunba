import { cookies } from 'next/headers'

// Apply recursion here
// 1. When token is present return the token but if not present and but payload-token is present then create a new access token with the help of the payload-token data and store that token in the cookie
export async function getTokenFromCookie() {
  // let token =  (await cookies()).get('payload-token')?.value
  // if (token == undefined || token == null) {
  // token =
  // }
  return (await cookies()).get('access_token')?.value
}
