---
title: LL3DA
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

1. 3D场景编码器，这个主要是提取3D场景特征用的，作者使用的是前人做好的模型—— Vote2Cap-DETR

我们最开始的输入是（假如有1w个点）1w个6维向量（假如记录坐标以及RGB，实际上还考虑别的一些东西，总之记录最原始的信息），然后这个向量会经过这个3D场景编码器，整体识别抽取特征，然后就可以得到1024个高维向量，不再只记录简单的位置颜色信息，而保留有其他信息。
<details>
<summary>最远点采样（FPS~</summary>
<p>
**FPS（Farthest Point Sampling，最远点采样）**是一种点云下采样方法，目的是从原始点云中选出一批分布尽量均匀的代表点。

操作过程如下：

1. 先随机选一个点作为第一个采样点；
2. 计算点云中每个点到“已采样点集合”的最近距离；
3. 选择距离已采样点集合最远的那个点，作为新的采样点；
4. 重复第 2、3 步，直到选够需要的点数。

```py
idx = farthest_point_sampling(old_xyz, K=1024)
new_xyz = old_xyz[idx]  # [1024, 3]
```


简单来说，FPS 每次都选“离当前已选点最远的点”，这样可以让采样点尽量覆盖整个点云空间，避免点都集中在某一小块区域。

PS：总之就是计算离所有已选点之间的距离，然后取最小的一个作为自己距离已选集合的距离，返回距离最大的一个点作为下一个采样点。核心目标：均匀。

</p>
</details>

<details>
<summary>Set abstraction下采样</summary>
<p>
SA层，就是把2048个点的特征融合到1024个点里

具体操作：
1. FPS找出最分散的1024个点
2. 然后每个点周围找K个点，得到[k,256](假如特征维度256)
3. 讲[k,256]经过一个MLP或者pooling得到一个新的256维度特征。

</p>
</details>


<details>
<summary>可自行限制视野范围的masked transformer</summary>
<p>
不同于casual transformer，这个可以看两边，只是两边不能看完，看多少可以由人来定

```py
import torch
import torch.nn as nn
import math


class SimpleMaskedSelfAttention(nn.Module):
    def __init__(self, dim=256, radius=0.64):
        super().__init__()
        self.dim = dim
        self.radius = radius

        self.q_proj = nn.Linear(dim, dim)
        self.k_proj = nn.Linear(dim, dim)
        self.v_proj = nn.Linear(dim, dim)
        self.out_proj = nn.Linear(dim, dim)

    def forward(self, xyz, feat):
        """
        xyz:  [N, 3]      每个 token 的空间位置
        feat: [N, 256]    每个 token 的特征
        """

        # 1. 生成 Q, K, V
        Q = self.q_proj(feat)   # [N, 256]
        K = self.k_proj(feat)   # [N, 256]
        V = self.v_proj(feat)   # [N, 256]

        # 2. 普通 attention 分数
        scores = Q @ K.T / math.sqrt(self.dim)  # [N, N]

        # 3. 根据 3D 距离生成 mask
        dist = torch.cdist(xyz, xyz)  # 生成一个矩阵，两点之间的距离

        # True 表示可以 attention，False 表示不允许 attention
        mask = dist <= self.radius    # [N, N]

        # 4. 把不允许看的位置设成 -inf
        scores = scores.masked_fill(~mask, float("-inf"))

        # 5. softmax 得到 attention 权重
        attn = torch.softmax(scores, dim=-1)  # [N, N]

        # 6. 用 attention 权重聚合 V
        new_feat = attn @ V  # [N, 256]

        # 7. 输出投影
        new_feat = self.out_proj(new_feat)

        return new_feat, attn, mask
```

</p>
</details>




<details>
<summary>点击查看简单特征提取流程~</summary>
<p>
从 40,000 个点里挑出 2,048 个代表点；（最远点采样）
每个代表点看自己附近的一小片区域；

把附近区域的信息聚合成一个 256 维特征。（采样点周围选出指定数量的点，通过一个MLP层简单提取一下局部特征，然后经过最大池化得到token）**注意提取局部特征的话，坐标一般就用相对于采样点的相对位置。**

然后再下采样到只有1024个token

接着是重点masked transformer，这里的mask比较特殊，限制视野。

然后带着一组查询向量cross-attention。

最后得到的查询向量作为输入投影层得到解码器输出token，3D空间特征解码完成

</p>
</details>


- 视觉提示编码器，鼠标点击一个点，或者直接一个框之类的

<details>
<summary>点击查看傅立叶位置编码详情~</summary>
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


<details>
<summary>点击查看ROI提取详情～</summary>
<p>
ROI 就是 Region of Interest，也就是“感兴趣区域”。例如我们框选了房间里的一把椅子，
就可以从整个场景中找到位于框内的点，再把这些点的特征汇聚成一个固定长度的特征向量。

下面是一种简化的实现：先判断哪些点位于 3D 框内，再对框内点的特征进行平均池化。

```py
import torch
import torch.nn as nn


class Simple3DRoiExtractor(nn.Module):
    def __init__(self, feature_dim=256, output_dim=768):
        super().__init__()
        # 将 ROI 特征转换为 MMT 使用的视觉提示特征
        self.projector = nn.Sequential(
            nn.Linear(feature_dim, output_dim),
            nn.ReLU(),
            nn.Linear(output_dim, output_dim),
        )

    def forward(self, point_xyz, point_features, boxes):
        """
        point_xyz:      [B, N, 3]，每个点的 xyz 坐标
        point_features: [B, N, D]，3D 场景编码器输出的点特征
        boxes:          [B, 6]，格式为 [cx, cy, cz, w, h, l]
        """
        center = boxes[:, None, :3]
        half_size = boxes[:, None, 3:] / 2

        # 找出位于 3D 框内的点
        inside_box = (torch.abs(point_xyz - center) <= half_size).all(dim=-1)

        # 对框内点的特征进行平均池化
        masked_features = point_features * inside_box.unsqueeze(-1)
        point_count = inside_box.sum(dim=1, keepdim=True).clamp(min=1)
        roi_features = masked_features.sum(dim=1) / point_count

        return self.projector(roi_features)


B, N, D = 2, 1024, 256
point_xyz = torch.rand(B, N, 3)
point_features = torch.rand(B, N, D)
boxes = torch.tensor([
    [0.5, 0.5, 0.5, 0.4, 0.3, 0.4],
    [0.4, 0.6, 0.5, 0.2, 0.4, 0.3],
])

extractor = Simple3DRoiExtractor(feature_dim=D, output_dim=768)
roi_features = extractor(point_xyz, point_features, boxes)
print(roi_features.shape)  # torch.Size([2, 768])
```

这段代码只是为了理解 ROI 提取的大致过程。论文实际使用的是预训练 3D 目标检测器提取的
ROI 特征，但没有详细说明具体采用了哪种池化或特征选择方式。

</p>
</details>





2. 文本指令编码器，如其名，最简单的编码器

多了一个格式化处理，似乎就只是在前面加上###human还有###assistant之类的


3. 多模态transformer（MMT）融合信息

也是查询向量染色，最后走个输出头

```py
# 已有输入
scene_feat_256 = scene_encoder(point_cloud)       # [1024, 256]
scene_tokens = scene_proj(scene_feat_256)         # [1024, 768]

text_tokens = text_embedding(tokenizer(text))     # [T, 768]

visual_prompt_tokens = prompt_encoder(click, box) # [P, 768]

query_tokens = learnable_queries                  # [32, 768]


# MMT 一层里大概发生的事

# 1. query / prompt / text 先互相交流
x = concat([
    query_tokens,
    visual_prompt_tokens,
    text_tokens
], dim=0)                                         # [32 + P + T, 768]

x = self_attention(x)

# 2. 取出更新后的 query 和 prompt
updated_queries = x[:32]                          # [32, 768]
updated_prompts = x[32:32+P]                      # [P, 768]

# 3. query / prompt 去读取 3D scene tokens
q_side = concat([
    updated_queries,
    updated_prompts
], dim=0)                                         # [32 + P, 768]

q_side = cross_attention(
    query=q_side,
    key=scene_tokens,
    value=scene_tokens
)

# 4. 最终主要拿 query 部分
mmt_output = q_side[:32]                          # [32, 768]


```

