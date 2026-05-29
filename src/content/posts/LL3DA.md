---
title: An odyssey with LSTM
published: 2026-05-19
pinned: false
description: "111之3D入门"
image: ./images/p12.webp
tags: [知识分享]
category: 知识分享
draft: false
---

总结：以往的多模态想理解三D空间，常见的做法是在不同角度拍照片然后一起喂给AI，但是这样算力要求高不说，而且空间信息损失严重，于是LL3DA就想着直接输入3D点云，首先对整个空间抽象，提取特征，接着与指令或者交互进行一个MMT融合，然后就可以得到一个可以喂给模型的东西了，除了整个房间之外，这个模型还可以理解文字指令以及鼠标点击指令

--- 

想实现这些依靠我们三大解码器以及多模态transformer

- 3D场景编码器，这个主要是提取3D场景特征用的，作者使用的是前人做好的模型

- 视觉提示编码器，鼠标点击一个点，或者直接一个框之类的

<details>
<summary>点击查看详情~</summary>
<p>
如果是点击一个点，我们正常可以直接得到空间位置坐标xyz，但是3个数字信息量太少，当然这里的信息量是指在神经网络中，在神经网络中，3个数字真的稍不留意就查无此人了，因此我们需要进行一个位置编码——“3D 傅里叶位置编码”

直接看代码，个人感觉知道怎么操作的就行了。
```py
    import torch
    import torch.nn as nn
    import math

    class FourierPositionEncoding(nn.Module):
        def __init__(self, input_dim=3, num_features=128):
            super().__init__()
            # 对应论文中的可学习矩阵 B
            self.B = nn.Parameter(torch.randn(input_dim, num_features) * 10.0) 

        def forward(self, p):
            # p 的维度: [Batch, 3]
            # 1. 矩阵相乘 2 * pi * p * B
            proj = 2 * math.pi * torch.matmul(p, self.B)
            # 2. 分别计算 sin 和 cos 并拼接
            return torch.cat([torch.sin(proj), torch.cos(proj)], dim=-1)

    p_click = torch.rand(1, 3) # 模拟一个 3D 坐标
    encoder = FourierPositionEncoding(input_dim=3, num_features=128)
    encoded_feat = encoder(p_click)
    print(encoded_feat.shape) # 输出: torch.Size([1, 256])
```


如果是一个框，就需要进行ROI提取


</p>
</details>




- 文本指令编码器，如其名，最简单的编码器

- 多模态transformer（MMT）融合信息