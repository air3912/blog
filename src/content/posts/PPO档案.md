---
title: "PPO method"
published: 2026-08-15
pinned: false
description: "梳理 PPO 在大语言模型强化学习中的状态、Critic、TD 误差、累计回报与 GAE 优势估计。"
image: ./images/p21.webp
tags: ["强化学习", "PPO", "Critic", "GAE", "大语言模型"]
category: 学习笔记
draft: false
---

### 一
在LLM中我们不会单独给一个token回馈reward，reward模型只会到\<EOS>再给整个句子打分，所以认为此前的r都是0。

不同于GRPO，PPO中的A是逐token计算的

然后是$s_t$,$a_t$的关系，LLM中没有复杂的环境变量，所以认为$s_{t+1}=s_t+a_t$，state就是当前已经输出的token。

### 二

PPO相较于GRPO要复杂一步，所以这里再单开一页写一些PPO里除GRPO之外的东西，就是只讲Critic，PPO里Adventage的来源。

- $r_t$：每一次动作给的reward，LLM就是输出一个token
- $G_t$：从第 $t$ 步开始到轨迹结束时获得的折扣累计回报，LLM中我们常设折扣因子$\gamma$为1，如此所有G均等于最后的reward。


- $V(s_t)$：由Critic输出，输入当前state，然后输出当前环境下预测出的得分


- $\delta_t$：TD误差，可以视作局部优势，所以这个数值表达生成这个 Token 前后，预期得分的变化量，$\gamma$为折扣因子




- $A_t$：逐词计算advantage（本质上也是$\gamma$取1的情况下，后续所有TD error的总和）。

- GAE：单独用TD error只顾及眼前，稍显局限，所以这里计算的综合长远优势。将当前和后续的TD误差按$(\gamma\lambda)$进行折扣累加，$\lambda$也是一个衰减因子，常取0.95.时间差越久影响关系越弱。




### 三

流程也很简单

1. 对于每个时间步，输出token之后，首先计算reward，由Reward model输出，每个token的$G_t$分数均等于最后结束符输出的reward分数


    $$
    G_t = r_t + \gamma r_{t+1} + \gamma^2 r_{t+2} + \cdots + \gamma^{T-t} r_T
    $$

2. 接着将state输入Critic model得到$V(s_t)$

3. 计算单步误差
  $$
  \delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)≈G_t−V(s_t)
  $$

4. 基于GAE倒序逐token推出A

    $$
    A_t^{\mathrm{GAE}}
    = \delta_t + \gamma\lambda\delta_{t+1}
    + (\gamma\lambda)^2\delta_{t+2}
    + \cdots
    + (\gamma\lambda)^{T-t}\delta_T
    = \delta_t + \gamma\lambda A_{t+1}^{\mathrm{GAE}}
    $$


    $$
    \qquad A_T^{\mathrm{GAE}} = \delta_T
    $$


--- 
有机会我也想训个model打王者，拿来和朋友单挑有机会吗hhh。