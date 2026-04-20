---
title: open-vclip
published: 2026-04-18
pinned: true
description: "https://arxiv.org/abs/2302.00624"
image: ./images/p10.webp
tags: [知识分享]
category: 知识分享
draft: false
---


### summary
在clip基础上进行改造，达到视频理解同时不会损失clip原有的图像理解泛化能力，文章的创新点有3点（对我而言。。

1. vit的kv拼接实现一个q查询前中后三帧内容的效果，没有大规模的更改架构
2. interpolated weight optimization：用于解决continual learning中的遗忘问题，就是字面意思，在原参数与当前参数之间分配权重作为最终结果参数
3. Stochastic Weight Averaging：配合iwr使用，最后得到的结果是原始clip和swa相融合，然后swa就是把训练后期的每次更新加进来进行一次平均

### method

#### constructing a VCLIP model

这部分作者做的很简单，但是很厉害，就是直接拼接KV，然后在注意力公式中K和V就从原本的（比如（n,d）变成（3n,d））然后我们知道注意力公式这部分更改是不会影响后续输出结果的维度的，这也是厉害之处，不仅让模型多看到了前后两帧的信息，还不用大刀阔斧修架构

#### regularizing the fine-tuning process

这部分是优化过程的为了保留原clip能力而做的努力（强化学习里的对齐操作也很重视这点

对于IWR：

首先拿到clip原本的参数，记 $\theta_clip$，对clip进行fine-tine，得到更新后的参数$\theta$，然后随机插值，即取一个系数α作为$\theta_clip$的权重然后与$\theta$进行加权平均得到一个中间参数$\theta_e$。计算$\theta$和$\theta_e$在数据上的loss。然后计算缩放系数，相当于回归权重吧，β = C / (1 - α)。最后总loss就是上一轮得到的参数得到的损失加上缩放系数乘插值权重得到的损失。（不过更新只需要动当前权重$\theta$即可，那个插值计算完损失就没用了。

然后SWA：

就是我们先IWR训练几轮，然后觉得差不多可以的时候就开始SWA，具体操作是，每个几个iteration就记录一下当前的权重，和之前记录的所有权重进行一个平均最后再取一个权重让最终的$\theta$与这个$\theta_swa$进行一个平均作为最终的结果

### experiments
#### datasets
- Kinetics-400&600: 作者的意思是在400上进行训练，然后在600中剩下的200个上进行zero-shot。

- UCF-101: test datasets

- HMDB-51: test datasets
#### results

- 说了挺多的，总之就是胜过了ActionCLIP X-CLIP TEXT4VIS，而且用不同的vit backbone赢得程度还不一样（之前看VIFI-clip也是这几个做baseline
- 然后是发现：更大的 backbone 通常零样本能力更强，普通 fine-tuning 不一定能把这种能力保住，甚至可能把原本的零样本能力弄差。
- 最后Ablation Studies：比较原始 CLIP、只加了时序建模的 VCLIP、以及再加上 IWR/SWA 的 Open-VCLIP。结论是加了时序建模就能理解视频，但是想保留原来的能力还是需要权重插值。然后是 IWR 和 SWA 的分别作用，去掉 IWR 会掉性能，去掉 SWA 也会掉性能，两个都保留时最好。

### strengths
- 轻量的时序建模
- 避免遗忘的参数插值（配合SWA食用效果更佳

### inspiration
时序建模是我感觉最厉害的，然后那个设定的是前中后三帧的数据，如果加一点的话，不知道有没有收益，或者说有收益的话，收益能不能兜住成本

以及，对于这种时序的东西，我总是喜欢往LSTM方面想，修改一下，就不是每次输入都要有输出，每一帧用vit或者resnet提取特征，然后输入LSTM，全部用来维护一个cell state。最后获得整个视频的特征，再进行输出，怎么说呢，感觉是再vifi-clip上进行一个加料，他是直接平均，这个是加个lstm，也不知道有没有收益。