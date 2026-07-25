---
title: "ShareGPT4V：用高质量描述改进多模态大模型"
published: 2026-07-23
pinned: false
description: "梳理 ShareGPT4V 如何构建高质量详细图像描述，并通过 Share-Captioner 扩展数据规模、改善多模态对齐。"
image: ./images/p2.webp
tags: ["图像描述", "多模态大模型", "视觉语言模型"]
category: 论文阅读
draft: false
---

这篇没有提出什么新的架构，主要研究在数据集方向，探索什么样的数据更利于多模态对齐。多模态模型的性能提升，不一定依赖更复杂的架构，高质量、详细、可扩展的 caption 数据本身就能显著改善模态对齐。

## 评估不同属性数据集

本文中数据集属性可以总结为三个方面：
- 类型：caption/VQA
- 质量：描述的简短/详细
- 规模：略

结论：高质量、详细的 caption 数据集视觉—语言对齐效果最好。

### method

以同一个 LLaVA-1.5-7B 为基线，保持模型架构、训练流程和数据规模基本一致，只改变加入 SFT 的 23K 数据，四组实验他们的数据分别来自：

- GPT-4 详细 caption
- BLIP2 短 caption
- GPT-4V VQA
- GPT-4V 详细 caption

结果是GPT-4V 详细 caption表现最好

## 低成本扩大数据集

这里作者用上一轮实验中得到的数据集ShareGPT4V作为数据集微调开源模型，得到了Share-Captioner模型，用来生产更大规模的同类型数据集

总结数据集构建流程：

1. 先从多种来源收集约 10 万张图片，输入输入 GPT-4V，让它直接看图生成详细 caption。最终得到 100K 图文对，即 ShareGPT4V
2. 用前者微调一个开源多模态模型，得到 Share-Captioner。
3. 作者再从公开数据集中选择约 120 万张图片，输入 Share-Captioner 批量生成 caption，最终得到约 1.246M 图文对，命名为 ShareGPT4V-PT

最后作者用这个数据集训练出了ShareGPT4V-7B，架构上同LLaVA-1.5.最终成绩甚至超过一些参数更大的模型



PS：
- GPT-4v：是早些年有视觉能力的GPT-4，那时候还没有GPT-4o，所以用的这个
- ShareGPT4V：一个图像-详细caption数据集
- ShareGPT4V-PT：同上，数据集规模更大，PT指pre-training
- Share-Captioner：用ShareGPT4V生成的model，用来替代GPT-4v生成更多数据，扩充数据集。
