---
title: FIne-tuned CLIP reading report
published: 2026-04-05
pinned: false
description: "VIFI-Clip阅读笔记"
image: ./images/p3.webp
tags: [知识分享]
category: 知识分享
draft: false
---


<details>

<summary>先简单认识一下VIFI-CLIP（知道的可以直接跳过~）</summary>
<p>
首先，VIFI-CLIP全称是video finetuned CLIP，然后对于普通的CLIP就不介绍了，是一个能够认识图片，理解图片内容的模型，视频微调就是直接用clip的架构，进行些许微调，最终让模型能够自己识别视频，做法也非常简单，我们正常clip是输出图片特征向量与对应的文字介绍的特征向量，而VIFI-CLIP就是输出一个视频（会抽帧）里抽出的那些帧的特征向量，然后求平均，作为这个视频的特征向量。

有人可能会疑惑，欸你多个图片特征求平均作为整个视频的特征向量？这也太荒唐了吧，表面看起来的确如此，以下是我个人的一些理解：

关键就是反向传播，虽然只能产生静态智能，但是这种智能强的可怕，我认知中的反向传播就像是先射箭后画靶一样，架构合理的前提下，给足数据量它近乎是全能的，所以对于平均值为什么可以作为整个视频的特征向量，我的想法是，因为它可以，所以就能做到，当然最后泛化能力如何以及如此微调不会影响原本的clip的能力就另说了。。
</p>
</details>


### abstract

当时，clip的问世教会了大家“大力出奇迹”，但是在视频领域很难像clip那样找到如此庞大的优质数据集，而且视频处理所需计算资源也高于单张图片，所以就有很多人尝试直接通过对clip进行改进，让他理解视频中的时序逻辑，作为clip下游的一个视频处理模型。但是之前很多人的很多种尝试，都在加入temporal information之后对原模型的generalization能力有所影响，基于此，作者提出了VIFI Clip，通过简单的temporal pooling以求让模型理解帧与帧之间时序关系的前提下不影响clip强大的generalization能力，同时呢，对于low-data regimes，作者同样提出了"bridge and prompt"的创新方法

### problem setting

这篇论文对成果进行了四种不同监督程度的测试：

1. Zero-shot；0样本，像clip那样用自然语言描述样本，而不给样本打标签，
- 配置：在Kinetics-400上进行训练，然后再HMDB-51，UCF-101和Kinetics-600上evaluate，并将结果与uni-modal methods以及"models that adapt image-based multi-modal VL models for video action recognition"进行对比，
- 结果："ViFi-CLIP achieves consistent gains of +6.7%, +4.8% and +4.5% in HMDB-51, UCF-101 and K-600 respectively."这种fine-tuning操作在不会影响原本clip强大的泛化能力的前提下bridge了从fiture到video的gap。
---
2. base-to-noval Generalization：用基础类训练，novel类则完全不给看直接测试
- 配置：evaluate with K-400, HMDB-51, UCF-101 and SSv2 and in comparison to XCLIP and ActionCLIP(这两个属于是为了让clip理解video这一模态单独做出一个时间理解components的模型)
- 结果：VIFI-Clip在novel类中展示出更高的精准度，对动态场景理解的更好
---
3. Few-shot：K-shot，每个类给看k个样本
- 配置：在HMDB-51, UCF-101 and SSv2数据集上对标prior best methods
- 结果：it provides better performance
against all the compared methods
---
4. Fully-supervised：全部给看，每个样本带有固定标签
- 配置：对标当时zero-shot里得两个模型在Kinetics-400上，除了比较准确率还会检测 FLOPs and throughput

- 结果：VIFI-Clip依旧表现得比那些加入额外component得要好，同时通过ablation实验，证明text和image两方面的微调都是有效果得
---

前两类用于检测泛化能力，后两类考察直接匹配能力

### analyze model' construction

- 首先是视频特征提取，作者比较了三种方法，一是提取帧的特征取平均，二是计算每一帧与监督文本匹配程度得分在求平均，三则是直接取其中一帧encoder作为整个视频的特征，一帧单独进行一次loss计算，通过在K400-tiny SSv2 HMDB-51 UCF-101几个数据集上的检测实验，得到方法一embedding fusion的结果最好

- 然后对于模型的泛化检测：首先是通过t-SNE聚类图得到模型的特征分离能力，发现text和image的encoder分别对特征识别有积极作用，最后对比了xclip和vanilla clip，结论是achieves competitive performance.

- 接着为了进一步理解该模型怎么理解时间线索，做了attention map。通过图得到两个结论：1. 比起单独的物体，会更多地关注人和物体间的interaction。2.会更多地注意到正在移动的物体

- 最后为了进一步检测泛化能力，还那啥，用一些很额"extreme out-of-distribution examples",结果注意力依旧保持在正确的位置上，结果十分惊艳

- 检测泛化能力之余，还要考率模型的计算效率。作者直接呈现图表，VIFI-Clip在处理速度、计算量、参数量方面均优于ActionClip以及XClip。

### VL prompting

在介绍完模型之后，作者继续提出"bridge and prompt"用于应对low-data的情况。

- bridge是指直接使用常规视频数据集微调Clip，bridge the modality gap。

- 关键在于prompt，将模型参数冻结，然后对于输入的text以及vision分别加入提示词向量（直接embedding）然后这个输入的向量是模型自己在反向传播中学习的

不过最终效果还是需要实验检验：
 
- 首先是准确率，用Kinetics-400数据集，进行few-shot transfer and base-to-novel generalization两个类型的测试，记录了ActionCLIP，XCLIP and fine-tune CLIP的对应测试结果。比较维度是很充足的，在few-shot setting中得到结论： VL prompting consistently provides better performance over A5 and even performs competitively against fine-tuning approaches。在base-to-novel generalization中得到结论依旧是VL prompting十分优秀

- 然后关注效率：比较了VL prompting和ActionCLIP和XCLIP和A5，结论：依旧无论吞吐量还是计算量都是领先的（计算量其实差不多，只有Action Clip大的过分）

### conclusion

这里作者并没有进行一个...emmmm很全面的一个conclusion，所以我就说说我学习之后的一些感想

1. 首先，我最疑惑的点是，这个模型把每一帧图片进行相同的处理求平均，那么没有添加任何时间元素，他对动作的识别（比如放杯子和拿杯子）会有那种错误吗，因为放杯子和拿杯子，完全可以通过倒放彼此变更，然后我提取到的都是相同的帧，那最后计算得到的视频特征岂不是完全一样？
（关于这个问题，后来和AI交流了一下，感觉最合理的解释可以是，残影（，hhh没错，可能是留下的残影吧，如果这么解释的话，我倒放拿杯子的视频，输入识别应该也是拿杯子？因为我残影是留在下面的））
2. 然后这个让模型自己学习增加prompt向量的方法真的很妙，很强

### Harvest
第一次完整阅读学术前沿的论文，主要的收获除了文章中两个创新点之外就是对论文有了一个大概的认知，知道了论文这东西应该怎么写，写论文需要做些什么之类的。最后就是，大道至简hhh，有时候简单的操作也会有意想不到的效果，倘若不是计算资源昂贵，我想现在这个领域那么多人，应该能很快发现各种不可思议的架构。毕竟实操之前谁也不敢打包票这些值不值得投入资源