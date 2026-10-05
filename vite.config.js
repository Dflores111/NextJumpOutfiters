import {defineConfig} from 'vite';
export default defineConfig({build:{target:'es2022'},optimizeDeps:{entries:['index.html']},server:{host:'127.0.0.1',hmr:{host:'127.0.0.1'}}});
