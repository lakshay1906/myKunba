# Tailwind Installation to Payload

Step - 1 Create a payload Application

```
npx create-payload-app
```

Step - 2

```
pnpm add -D tailwindcss postcss autoprefixer
```

Step - 3 Initialize tailwind

```
pnpm dlx tailwindcss@3.4.17 init -p
```

Step - 4 Replace content in tailwind.config.js with the below

```
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{jsx,tsx}'], // tell tailwind where to look
  theme: {
    extend: {},
  },
  plugins: [],
}
```

step - 5 Add the below styles to global.css or styles.css

```
@tailwind base;
@tailwind components;
@tailwind utilities;
```
