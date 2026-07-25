---
title: "Panoptic Captioning：用结构化描述连接图像与文本"
published: 2026-07-24
pinned: false
description: "梳理 Panoptic Captioning 的 PancapEngine、PancapScore 与 PancapChain，理解精确图像描述的生成和评估。"
image: ./images/p4.webp
tags: ["图像描述", "多模态大模型", "视觉定位"]
category: 论文阅读
draft: false
---

## 介绍

短caption太简略，长caption会有很多多余的东西，而且表达位置之类的信息很模糊，于是作者提出Panoptic Captioning，在精炼提取重要语义的基础上进一步加入边界框坐标，至于这种精确描述的效果，在图一中通过一种将caption作为prompt输入给AI reconstruct 一个new picture。可以看到作者的要比ShareGPT4v效果好一些

而且不仅在这个领域，输入给计算机的信息感觉基本都是精细点效果会越好

## panoptic评估标准

首先定义panoptic caption，对于一张图，需要有以下5个维度的数据：
  
- Semantic tag
- Location
- Attribute
- Relation
- Global image state

然后是PancapScore评分标准

- 先将模型生成的以及参考答案（数据集）caption提取成以上维度数据
- Location/tag；标签语义是否一致以及框选IoU
- Attribute：转成问答题
- Relation：转成问答
- Global：评估语义是否一致
- 整合以上4个部分的得分作为PancapScore得分

## 数据

### PancapEngine数据生成engine

先用 OLN 做类别无关检测，然后把每个区域裁剪出来，交给 RAM 分类，得到语义标签，再把这些类别作为文本提示交Grounding-DINO/OW-DETR两个开放词汇检测器，让它们重新寻找可能遗漏的实例，得到区域集合 R‘，最后合并 R 与 R′，根据 IoU 去掉重复框，然后将原始图片和所有标签/框加上所有要求prompt，让Gemini-Exp-1121 生成正式 panoptic caption。同时，Qwen2-VL-72B 也生成一份，用于质量核验。

### SA-Pancap Benchmark

数据划分：9000 张训练图：自动标注；500 张验证图：自动标注；130 张测试图：人工精修。

还用了DINOv2提取图片特征，确保验证集和测试集内部相似度不会太高

## 模型

这里模型的训练方法很新，作者提出了PancapChain，尝试将3种能力都塞给一个模型，于是会有4种训练输入

- 训练找框：输入图片通过prompt要求找出所有实例的框
- 训练识别：输入图片和答案框，要求输出每个框的标签
- 训练补漏：训练输入故意只给部分集合，然后要求输出剩下的实例
- 训练caption生成：将所有信息输入，然后要求输出完整caption

这里第三种很重要，因为训练时每一次输入都是标准答案，但是推理时每一步输入来自前面一步的输入，一步错步步错，所以加入补漏训练，确保最终答案的质量。

混合式训练加链式推理，将任务拆开降低了训练难度，如果训练一次性输出这么一大堆，可能需要很庞大的数据集和模型参数。这种做法感觉类似算法中的用时间换空间

## experiment

在SA-Pancap Benchmark上进行评估，PancapChain-13B 的综合表现最好，并且超过一些参数规模大得多的模型

然后是图像重建实验，通过PancapChain精准的caption，重建得到的图效果明显会更好

对于图文检索通过PancapChain精准的caption，能更精准的找到这张图

总之，这种精确的caption是最适合输入给计算机的caption，bbox对于人类而言，看第一眼或许精确的有些抽象，但是对于计算机而言却是最合适的描述。

然后链式推理的上游对下游的影响也难以忽视，感觉除了补漏之外还可以进行其他补强，补漏确保实例数量，但是如果第一层问题不只是数量还有质量比如框大了点之类的，第二层不知道能不能兜住底，感觉可以试试在训练识别能力时对用的数据进行增强之类的
