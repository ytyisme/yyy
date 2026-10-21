# 皮肤参考图片

以下四张原图来自用户指定链接，原文件保存在本地。根据用户后续「把人物抠出来」的要求，使用内置 image_gen 工具移除背景，另存4张透明PNG。商场预览、商品卡片和第21关的角色共用这些抠图文件，以面向镜头的透明人物精灵显示。

- `yellow-egg.png`：绝望的蛋 · 小黄。原图：https://makerworld.bblmw.cn/makerworld/model/CN33215534959907/design/39332e33392b1bb6.jpg?x-oss-process=image/resize,w_1200/ignore-error,1
- `jawline.jpg`：完美下颚线 · 橘猫。原图：https://channelgz.photo.store.qq.com/psc?/channel/NaDwC23LjvXqrn3RH.9z8RSAnrFVOz8VCGCdW7lcaZ0uWZl7U51zlBAUmAz0*tNa8X4hyfzg8OaCC5asMR349yV.9s2ne39vy*2x4mWdbGw!/b=&bo=OAS4BDgEuAQWADA!&ek=1&tl=1
- `makima.jpg`：玛奇玛。原图：https://haowallpaper.com/link/common/file/getCroppingImg/ab2fe1240e550b000cdb7b4e07051904
- `jawline-plus.jpg`：微笑表情猫。原图：https://xps14.xiaopeng.com/a478de0100f45b4f54e715092603c5b0.png

文件扩展名按实际图片格式保存。定价、所有权和装备逻辑见 `lib/skin-shop.mjs`。

## 人物抠图

工具模式：内置 `image_gen`，`background-extraction` 编辑，`transparent_background=true`。原图保留，未覆盖。

- [小黄透明PNG](yellow-egg-cutout.png)：1448 × 1086，透明像素约65.6%。
- [微笑表情猫透明PNG](jawline-plus-cutout.png)：1254 × 1254，透明像素约19.0%。
- [下颚线橘猫透明PNG](jawline-cutout.png)：1186 × 1326，透明像素约36.0%。
- [玛奇玛透明PNG](makima-cutout.png)：1675 × 939，透明像素约43.0%。

提示词共同要求：只移除人物或猫猫外的背景；尽量保留原来的脸、表情、颜色、姿势和细毛边缘；不要改画风或补画身体；输出真实透明背景，不绘制棋盘格、描边或投影。小黄包含天线、手和鞋；橘猫包含双耳、胡须和可见胸口；表情猫保留宽脸表情；玛奇玛包含头发、遮嘴的手臂、衬衫和领带，并去掉背后的红色场景与链条。

4张图片的完整最终提示词及输入输出对应关系保存在 [cutout-prompts.json](cutout-prompts.json)。已读取PNG alpha通道确认背景透明，未通过后处理重绘人物或改变生成的透明度。
