import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from "vite-plugin-singlefile"
import { visualizer } from 'rollup-plugin-visualizer';



// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), visualizer({
    open: true, // 自动打开浏览器展示报告
    gzipSize: true, // 显示 gzip 压缩后的大小
    brotliSize: true, // 显示 brotli 压缩后的大小
  }),],

})
