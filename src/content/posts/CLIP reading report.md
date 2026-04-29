---
title: CLIP reading report
published: 2026-04-05
pinned: false
description: "clip阅读笔记"
image: ./images/p2.webp
tags: [知识分享]
category: 知识分享
draft: false
---




CLIP全称contrastive language-image pretraining，对比语言和文字，就是用自然语言做监督信号（在此之前的模型训练时都是固定的标签，泛化能力一般）

### Abstract部分

之前的模型都是一组固定的标签，这种restricted form限制了泛化能力，于是作者提出用自然语言代替标签作为监督信号，用caption与image配对的方式使模型拥有更广泛的泛化能力。在不经过样本训练的情况下最后的成绩依旧亮眼

### motivation

- 先前的问题是大家都通过imagenet这种人工标注的有监督数据集进行训练，这样weakness很明显，就是模型就只认识有标签的东西，泛化能力一般。
- 首先作者的灵感算是来自NLP领域，NLP领域通过大量的raw text训练获得了革命性的进步，展现出zero-shot learning能力
- 然后作者提到了先前的一些类似的工作，但是最终表现成绩却有些一般，主要是数据规模不够，于是，作者收集了400million对数据集，训练出Clip，测试在zero-shot transfer方面明显优于transformer model，对于对比损失，前人已验证其可行性

### Approach

- 前人有做过相关的工作，但是由于时代问题（当时对于自然语言特征提取方面）以及数据集太小，没做出太大的成果
- 自然语言监督，优势是不需要像传统做法那样大量人工标注数据集，以及自然语言具有强大的泛化能力
- 数据集：现存的数据集要么数据量不够，要么质量不行，所以openai自己手动收集了400million的数据集在互联网上，种类齐全，质量也没得说
- pre-Training method: 如果采用最直接的训练方式，需要的成本很高，所以作者决定采用对比学习，比起让ai生成caption然后进行参数修正，这种直接特征比对的效率要高4倍
- Model：对于image encoder：作者推荐两种，一是逆行些许修改的resnet-50，其二是Vision Transformer。对于text encoder：作者直接用的一个有63M-parameter参数的transformer架构，并在效率上进行些许优化。（对于image encoder增加宽度深度以及分别率，但是对于文本编码器则只增加对应的宽度。
- training：作者训练了RN50、RN101，RN50x4、RN50x16以及RN50x64，ViT-B/32、ViT-B/16 和 ViT-L/14。采用adam optimizer with decoupled weight decay regularization，同时使用osine schedule动态调节学习率。然后还采用了混合精度方法（节省显存

### experiment

1. zero-shot transfer
- 首先进行了zero-shot transfer测试泛化能力，具体操作是先提取图片特征，然后将数据集名称通过text encoder变成一组文本特征向量，计算相似度在输出。（这里作者还提到了可以将text encoder作为hypernetwork来理解）
- 然后在imageNet上与Visual N-Grams进行对比，结果是碾压的（Visual N-Grams 在 ImageNet 上的零样本准确率仅为 11.5%，而最强的 CLIP 模型直接飙升到了 76.2%），在Yahoo上 CLIP achieves a 95% reduction in the number of error，在SUN上，CLIP more than doules the accuracy of Visual N-Grams。随后作者还理性分析了领先的原因
- 然后作者提出了一个prompt engineering的东西，传统训练集设计时没有考虑单词的多意性，所以可以通过提示词给text加上一个模板，以免部分歧义。在imageNet上提示功能了1.3%的准确率。
- 最后作者综合比较了resnet-50在许多数据集上，其中大部分时Clip获得胜利，升值在STL10达到了99.3%的新纪录。但是通过结果也可以看到弱点也很明显，就是对于特定（如卫星，医学等）领域表现要比差，最后通过比较认为clip综合表现和4-shot的监督样本差不多。
---
2. representation learning
为了evaluate模型的特征学习能力，作者选择了linear classifier的方法，与诸多现有模型进行一个全面的比较。（之加入一个线性分类器可以确保都是clip自己內部提取的特征）。
结论：计算效率更高的前提下，在27个数据集中的21取得胜利，劣势依旧是一些专业领域。然后对于clip自己来说，发现vit作为image encoder效果要比resnet效果好，计算效率也要高一些（结果又是transformer）
---
3. robustness
这一部分作者提出了"effective robustness"，基于当时很多模型在数据集上准确率很高但是放在现实中却总是出现问题这一现象而提出的新的模型能力评测指标。
这一节的考核方式是使用一种distribution shift data。比较了clip和创痛经典模型ResNet-101以及当代最强Noisy Student EfficientNet-L2，结果是遥遥领先（
然后在这之后作者还尝试比较zero-shot clip和加一个训练过的分类头的clip，结果加上分类头的linear probe clip表现却不如原始clip，作者认为这是因为训练使clip变得更多的染上imageNet的颜色，导致丧失对其他风格的泛化能力。
---
4. Comparison to Human Performance

最后呢，作者还拿来和人类对比，识别猫和狗的种类
zero-shot：clip有93.5%的准确率，但是人类只有53.7%（说实话我觉得高了，正常不知道相关知识的应该都是纯懵吧）

one-shot：clip提升很少甚至可能是退步（其实很强了已经，我觉得是可以算是忽略不记），但是人类涨到76%

two-shot：和one-shot相差不多（挺符合直觉的，作者也说这第二个样本对于人脑来说完全多余）

---
5. data overlap analysis
作者考虑到庞大的训练集中可能有后续测试数据的可能性，于是开始验证，首先作者没有考虑对数据进行删除，因为这很笨，以后clip可能运用于很多地方，进行多次测试，不能每次测试前都进行一次找重复和删除，于是作者决定直接找重叠的数据集，并验证这些数据集对结果的影响

"for each evaluation dataset, we run a duplicate detector on its examples"然后将数据集根据相似度分成overlap组和clean组，以及所有数据的all组，然后分别做zero-shot测试，

最后的结果进一步证实了clip所谓的泛化能力，整体重叠率不高，而且35个训练集中有9个完全没有重叠，整体准确率波动极小，并且对于重叠率最搞的数据集结果成绩只提高0.2%（甚至可以当作误差处理。。。）

### limitations

- 首先是并非全能，在很多任务上未达state of the art，想实现的话对算力要求太高，而且Fine-grained classification，Abstract tasks，Novel tasks上表现很一般

- 虽然clip的泛化能力很强，但是有些数据集上以及可以看到它在有些领域只是把东西背下来，没有实现真正完全的泛化

- 不能实现自己generate novel outputs。

- 暴力堆数据，数据效率低

- 数据来源互联网，故而有着互联网的某些底色

- few-shot时的性能倒退问题


### harvest
除了离谱的400million数据集外，作者还设计了很多，比较了很多，也考虑了很多，做科研需要一颗沉得下去的心，不能急于求成，并且要坦然面对实验结果展示出的缺陷，感觉自己至少知道做学术到底是怎么一回事了。想法需要基于现实，需要站在前人的肩膀上，同时也认识到了自己以前的不成熟，把学术想的过于简单了。