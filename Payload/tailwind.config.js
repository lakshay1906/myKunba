/** @type {import('tailwindcss').Config} */
export const content = [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}', // If using the app directory
    './payload/**/*.{js,ts,jsx,tsx}', // Critical for Payload!
];
export const theme = {
    extend: {},
};
export const plugins = [];