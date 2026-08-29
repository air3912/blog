---
title: "Test-Time Training（TTT）"
published: 2026-08-21
pinned: false
description: "梳理 Original TTT、TTT-Layer 与 LaCT（TTT Done Right）的核心思路。"
image: ./images/4ec0adba1f1d2e353005cfa557b83aea.jpg
tags: ["Test-Time Training", "TTT", "深度学习"]
category: 学习笔记
draft: false
---

我目前最感兴趣最想做的方向，感恩相遇，自Test-Time Training Done Right问世，我觉得TTT已经优化到足以被认可并使用的地步了，其在推理时维护动态fast weights实现一定程度上里记忆能力和我之前幻想的动态智能有一定程度的重叠，虽然不算真正的动态智能，但是我感觉比hypernetwork靠谱多了

## 一、Original TTT

- 首先构建Y型结构，一个特征提取主干然后两个任务头，一个监督学习预测分类，还有一个自监督头，预测旋转角度。一次传播手里两个loss，单独loss只修正自己的头，然后相加的修正主干

- 于是对于一个没见过的任务，TTT会先走副线修正副分类头的同时也会修正特征提取主干，从而让分类头有更好的特征用

1. TTT-standard：这是处理单张图片用的，预测完就把参数回归原始形态
2. TTT-Online：这是处理视频用的，不会处理一帧就回去

（想出这个的感觉真的很天才吧

## 二、TTT-Layer

把transformer的block里的self-Attention换成TTT-Layer

- 在外层有三个投影矩阵：训练输入，目标标签，测试考题，等价于QKV
- 在内层有个微型神经网络，就是核心记忆体。

流程： K作为网络的输入，然后对标这个V作为网络的标签（answer），然后更新网络参数，接着Q走这层网络得到特征给到下一层

《套到transformer上用，这是真天才吧，强强强


## 三、TTT Done Right

ICLR 2026的LaCT，TTT落地的最后一块拼图，会有这么巧的事吗，这命中注定的感觉，感谢前人，感谢LaCT，感谢提出LaCT的作者恰好在2026这个我入门的节点将TTT完善，而我又恰好在这个节点偶然了解到这个TTT，这太美妙了，简直就是命中注定。

大概就是一次处理一整个chunk，然后输入分两路，一边进行全局Attention，另一边则是走TTT，输出直接相加，计算Loss，反向传播。但是这么处理也有问题，就是他一整个chunk更新一次内部权重，这就导致了，于是（比如这里处理的是从5到8这四个token，第5个token进行query的时候，权重是记忆了后面三个token的信息的，所以在causal方面有所局限。

所以呢就是这里全局注意力是用的是SWA（sliding Window Attention，计算注意力时只和最近w个K/V做attention。），通过SWA实现简单的causal，然后这个长度w>=chunk长度

## final

以上是我认为如果想了解TTT相关领域至少要看的三篇，然后论文链接：（超级推荐

1. [Test-Time Training with Self-Supervision for Generalization under Distribution Shifts](https://proceedings.mlr.press/v119/sun20b.html)
2. [Learning to (Learn at Test Time): RNNs with Expressive Hidden States](https://arxiv.org/abs/2407.04620)
3. [Test-Time Training Done Right](https://proceedings.iclr.cc/paper_files/paper/2026/hash/ffbfff81fb78e4bb558273b91e12e318-Abstract-Conference.html)
