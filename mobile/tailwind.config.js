/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F5',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['OpenSans-Regular', 'sans-serif'],
        light: ['OpenSans-Light', 'sans-serif'],
        normal: ['OpenSans-Regular', 'sans-serif'],
        regular: ['OpenSans-Regular', 'sans-serif'],
        medium: ['OpenSans-Medium', 'sans-serif'],
        semibold: ['OpenSans-SemiBold', 'sans-serif'],
        bold: ['OpenSans-Bold', 'sans-serif'],
        extrabold: ['OpenSans-ExtraBold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
