# Cloud Guide:

## Running the app on EC2 (avoid homepage reload / proxy issues)

**Always use production mode on EC2:**

```bash
npm run build
npm start
```

- **Do not run `npm run dev`** in production. The dev server uses Turbopack by default and can cause crashes/reloads; production (`next start`) does not use Turbopack.
- **Proxy is already restricted** in code: `src/proxy.ts` runs only for `/dashboard`, `/api/dashboard`, and `/user/profile`. The homepage (`/`) and other public routes never run through the proxy, so the reload issue does not occur in production when you use `npm start`.
- If you ever need to run the dev server on the server (e.g. debugging), use **`npm run dev:webpack`** to avoid Turbopack.

**Environment variables on EC2:** Set `NEXT_PUBLIC_PUBLIC_URL` (public domain, e.g. `https://your-domain.com`) and `NEXT_PUBLIC_NEXT_URL` (how the app reaches itself, e.g. `http://localhost:3000` or the EC2 private IP) so canonical URLs and server-side API calls work correctly.

---

### Connect to AWS EC2 on local system

#### 1. Firstly put you .pem downloaded file in you

```
C:\Users\lbhat\.ssh
```

#### 2. Then run the below command using cmd or powershell

```
ssh -i my-key.pem ec2-user@<IP>
```

## Postgresql Guide:
