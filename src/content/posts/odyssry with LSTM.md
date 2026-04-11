---
title: An odyssey with LSTM
published: 2026-04-10
pinned: true
description: "一起看看transformer诞生前LSTM的最高光时刻。论文地址：https://arxiv.org/abs/1503.04069"
image: ./images/p8.webp
tags: [知识分享]
category: 知识分享
draft: false
---
哎哎哎，造化弄人啊，看这个论文能明显感觉到LSTM在当时的统治级地位，可惜我看时间，就在这个论文出现第二年，transformer就问世了。。。不过LSTM的生态位虽然被挤占了，但是相比transformer的n方级时间复杂度，LSTM在现在处理一些特别长的数据的时候依旧有自己的优势吧，应该吧hhh

### summary
自从LSTM诞生以来，产生了许多variants。然后为了进一步理解LSTM，作者从三个方向，对原版加8个变体进行大规模分析。结合超参数优化和重要性评估进行了5400次实验，最终发现还是最标准的原始LSTM最强，以及forget gat和output activation function是最关键的组成部分

### method

- 超参数优化+重要性评估：作者超参数选取用的是Random Search。然后结果使用fANOVA框架评估得到对结果影响最大的超参数
<details>
<summary> 简单认识一下fANOVA，会的可以直接跳过~</summary>
<p>
首先在py中是有封装好的py-fANOVA库可以直接用的，然后是比较老，最后我自己实力和时间也不允许，就不尝试他的底层实现了
原理（简洁版）：首先是把超参数数据以及对应的结果输入。建立随即森林模型

</p>

</details>
### strengths


### weaknesses


### inspiration
