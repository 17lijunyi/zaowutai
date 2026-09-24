# 造物台纸艺主题资源

- `paper-wallpaper.webp`：奶油白纸纹、右上金色折角、右下橙色折纸；1586 × 992，约 94 KB。用于全局页面背景和默认主题缩略图。
- `paper-grain.svg`：低透明度、可平铺的静态纹理，用于侧栏、标题栏、弹窗和窄屏背景。
- `default-theme.png`：保留的上游资源。

纸艺壁纸通过内置 ImageGen 工具生成，再用 Sharp 转换为 WebP；没有外部图片请求。参考的是用户确认的首页预览。深色模式使用暖色遮罩；窄屏隐藏折角、保留轻纸纹。所有背景均不接收鼠标事件，不覆盖正文或改变滚动布局。

## ImageGen 最终提示词

Create a production background wallpaper asset for the pictured Chinese desktop app. Reference is STYLE ONLY: recreate its warm ivory paper texture and orange/golden origami corners as a clean background. Output landscape 16:10 high resolution. REMOVE ALL UI, ALL text, ALL icons, ALL borders, ALL controls, ALL windows, ALL card shapes, ALL sidebar. Entire full bleed canvas is subtle cream handmade cotton paper (#F6F0E5), with very fine low contrast natural fibers, beautiful gentle daylight from top left. Very restrained paper origami corner at extreme top right (a cream paper flap reveals muted golden ochre underside within the outer 15% width and 23% height). Another narrow burnt orange paper fold at extreme bottom right within outer 12% width and 20% height, small overlapping ivory paper lip. A faint diagonal ivory paper layer only at extreme bottom left within outer 12% height. Keep at least central 80% area completely quiet flat ivory paper so app text will remain fully readable. All decorations hug outer edges and corners. No object in center. Real tactile paper rather than illustration, soft natural shallow shadows. Absolutely NO text or logo or app layout remnants. This wallpaper will sit behind real interactive UI, not be a screenshot.
