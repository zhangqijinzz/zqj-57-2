import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, ScrollView, Input, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import RecipeCard from '@/components/RecipeCard';
import { recipes } from '@/data/recipes';
import { useAppStore } from '@/store/useAppStore';
import type { Recipe, NightShiftStage } from '@/types';

const stageOptions: { type: NightShiftStage; label: string; icon: string }[] = [
  { type: 'early', label: '夜班初期', icon: '🌆' },
  { type: 'mid', label: '夜班中期', icon: '🌙' },
  { type: 'late', label: '夜班后期', icon: '🌌' },
  { type: 'pre_sleep', label: '睡前', icon: '😴' },
];

const categoryOptions = [
  { type: 'all', label: '全部', icon: '🍽️' },
  { type: 'refresh', label: '提神', icon: '☕' },
  { type: 'sleep', label: '助眠', icon: '💤' },
  { type: 'energy', label: '能量', icon: '⚡' },
];

const stageTips: Record<NightShiftStage, string> = {
  early: '💡 夜班刚开始，来杯提神饮品，开启精力充沛的夜晚',
  mid: '💡 夜班中期，补充能量，保持状态',
  late: '💡 夜班后期，注意补充营养，坚持就是胜利',
  pre_sleep: '💡 即将下班，选择助眠食物，帮助你更好地休息',
};

const RecipesPage: React.FC = () => {
  const [activeStage, setActiveStage] = useState<NightShiftStage | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareDescription, setShareDescription] = useState('');
  const [shareImage, setShareImage] = useState<string>('');
  const [localRecipes, setLocalRecipes] = useState<Recipe[]>(recipes);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSharedId, setLastSharedId] = useState<string>('');
  const [switchInfo, setSwitchInfo] = useState<{ stage: string; category: string } | null>(null);
  const { currentStage, stageLabels } = useAppStore();

  const filterRecipes = useCallback(() => {
    let filtered = localRecipes;

    if (activeCategory !== 'all') {
      filtered = filtered.filter((r) => r.category === activeCategory);
    }

    if (activeStage !== 'all') {
      filtered = filtered.filter((r) => r.suitableStage.includes(activeStage));
    }

    console.log(
      '[RecipesPage] 筛选食谱，阶段:',
      activeStage,
      '分类:',
      activeCategory,
      '数量:',
      filtered.length
    );
    setFilteredRecipes(filtered);
  }, [activeStage, activeCategory, localRecipes]);

  useEffect(() => {
    filterRecipes();
  }, [filterRecipes]);

  useDidShow(() => {
    console.log('[RecipesPage] 页面显示');
  });

  const handleStageClick = (stage: NightShiftStage | 'all') => {
    console.log('[RecipesPage] 点击阶段:', stage);
    setActiveStage(stage);
  };

  const handleCategoryClick = (category: string) => {
    console.log('[RecipesPage] 点击分类:', category);
    setActiveCategory(category);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    console.log('[RecipesPage] 点击食谱:', recipe.id, recipe.name);
    Taro.navigateTo({
      url: `/pages/recipe-detail/index?id=${recipe.id}`,
    });
  };

  const handleFabClick = () => {
    console.log('[RecipesPage] 点击分享按钮');
    setShareImage('');
    setShareDescription('');
    setShowShareModal(true);
  };

  const handleCancelShare = () => {
    console.log('[RecipesPage] 取消分享');
    setShowShareModal(false);
    setShareDescription('');
    setShareImage('');
  };

  const handleChooseImage = () => {
    console.log('[RecipesPage] 选择图片');
    
    if (typeof Taro.chooseImage === 'function') {
      Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log('[RecipesPage] 选择图片成功:', res.tempFilePaths);
          if (res.tempFilePaths && res.tempFilePaths.length > 0) {
            setShareImage(res.tempFilePaths[0]);
          }
        },
        fail: (err) => {
          console.error('[RecipesPage] 选择图片失败:', err);
          Taro.showToast({
            title: '选择图片失败',
            icon: 'none',
          });
        },
      });
    } else {
      Taro.showToast({
        title: '当前环境不支持选图',
        icon: 'none',
      });
    }
  };

  const handleSubmitShare = () => {
    console.log('[RecipesPage] 提交分享，描述:', shareDescription, '图片:', shareImage);

    if (!shareImage) {
      Taro.showToast({
        title: '请先选择图片',
        icon: 'none',
      });
      return;
    }

    if (!shareDescription.trim()) {
      Taro.showToast({
        title: '请输入描述',
        icon: 'none',
      });
      return;
    }

    const sharedRecipe: Recipe = {
      id: Date.now().toString(),
      name: '食堂分享',
      description: shareDescription,
      coverImage: shareImage,
      category: 'energy',
      categoryLabel: '能量',
      suitableStage: [currentStage],
      suitableStageLabels: [stageLabels[currentStage]],
      ingredients: [],
      steps: [],
      nutrition: { calories: 0, protein: 0, carbs: 0 },
      author: {
        name: '我',
        avatar: 'https://picsum.photos/id/1005/200/200',
        workplace: '我的工作单位',
      },
      likes: 0,
      isShared: true,
      isNew: true,
    };

    const newRecipeId = sharedRecipe.id;
    setLastSharedId(newRecipeId);

    const updatedRecipes = localRecipes.map((r) => ({ ...r, isNew: false }));
    setLocalRecipes([sharedRecipe, ...updatedRecipes]);

    let stageSwitched = false;
    let categorySwitched = false;
    let targetStage: NightShiftStage | 'all' = activeStage;
    let targetCategory: string = activeCategory;

    if (activeStage !== 'all' && activeStage !== currentStage) {
      targetStage = currentStage;
      stageSwitched = true;
    }

    if (activeCategory !== 'all' && activeCategory !== 'energy') {
      targetCategory = 'all';
      categorySwitched = true;
    }

    if (stageSwitched || categorySwitched) {
      setSwitchInfo({
        stage: stageSwitched ? stageLabels[currentStage] : '',
        category: categorySwitched ? '全部' : '',
      });
    } else {
      setSwitchInfo(null);
    }

    if (stageSwitched) {
      setActiveStage(targetStage);
    }
    if (categorySwitched) {
      setActiveCategory(targetCategory);
    }

    setShowShareModal(false);
    setShareDescription('');
    setShareImage('');

    setShowSuccessModal(true);

    setTimeout(() => {
      setLocalRecipes((prev) =>
        prev.map((r) => (r.id === newRecipeId ? { ...r, isNew: false } : r))
      );
      setLastSharedId('');
    }, 8000);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSwitchInfo(null);
  };

  const handlePullDownRefresh = () => {
    console.log('[RecipesPage] 下拉刷新');
    setTimeout(() => {
      filterRecipes();
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  useEffect(() => {
    if (typeof Taro.onPullDownRefresh === 'function') {
      Taro.onPullDownRefresh(handlePullDownRefresh);
      return () => {
        if (typeof Taro.offPullDownRefresh === 'function') {
          Taro.offPullDownRefresh(handlePullDownRefresh);
        }
      };
    }
  }, []);

  const getStageTip = (): string => {
    if (activeStage === 'all') {
      return '💡 选择当前夜班阶段，为你推荐最合适的食谱';
    }
    return stageTips[activeStage];
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>🥗 能量食谱卡</Text>
        <Text className={styles.subtitle}>
          根据夜班阶段，为你推荐最合适的食物
        </Text>
      </View>

      <View className={styles.stageSelector}>
        <Text className={styles.label}>📍 当前夜班阶段</Text>
        <ScrollView className={styles.stageTabs} scrollX>
          <View
            className={classnames(styles.stageTab, activeStage === 'all' && styles.active)}
            onClick={() => handleStageClick('all')}>
            <Text className={styles.stageIcon}>👥</Text>
            <Text className={styles.stageLabel}>全部</Text>
          </View>
          {stageOptions.map((stage) => (
            <View
              key={stage.type}
              className={classnames(
                styles.stageTab,
                activeStage === stage.type && styles.active
              )}
              onClick={() => handleStageClick(stage.type)}
            >
              <Text className={styles.stageIcon}>{stage.icon}</Text>
              <Text className={styles.stageLabel}>{stage.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView className={styles.categoryTabs} scrollX>
        {categoryOptions.map((category) => (
          <View
            key={category.type}
            className={classnames(
              styles.tabItem,
              activeCategory === category.type && styles.active,
              activeCategory === category.type && styles[category.type]
            )}
            onClick={() => handleCategoryClick(category.type)}
          >
            <Text className={styles.tabIcon}>{category.icon}</Text>
            <Text className={styles.tabLabel}>{category.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.tipCard}>
        <Text className={styles.tipText}>
          <Text className={styles.emoji}>💡</Text>
          {getStageTip()}
        </Text>
      </View>

      <View className={styles.recipeList}>
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={handleRecipeClick}
              isHighlight={recipe.id === lastSharedId}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emoji}>🍽️</Text>
            <Text className={styles.title}>暂无食谱</Text>
            <Text className={styles.desc}>该条件下暂时没有推荐食谱</Text>
          </View>
        )}
      </View>

      <Button className={styles.fab} onClick={handleFabClick}>
        <Text className={styles.icon}>📸</Text>
      </Button>

      {showShareModal && (
        <View className={styles.shareModal}>
          <View className={styles.modalContent}>
            <Text className={styles.modalTitle}>分享食堂实拍</Text>
            <Text className={styles.modalDesc}>
              分享你今天的宵夜/早餐，让更多工友看到
            </Text>

            <View className={styles.stageHint}>
              <Text className={styles.stageHintIcon}>📍</Text>
              <Text className={styles.stageHintText}>
                将加入「
                <Text className={styles.stageHintStage}>{stageLabels[currentStage]}</Text>
                」推荐 · 「
                <Text className={styles.stageHintCategory}>能量</Text>
                」分类
              </Text>
            </View>
            
            {shareImage ? (
              <View className={styles.imagePreview} onClick={handleChooseImage}>
                <Image
                  src={shareImage}
                  mode="aspectFill"
                  className={styles.previewImage}
                />
                <View className={styles.changeImageBtn}>
                  <Text className={styles.changeImageText}>更换图片</Text>
                </View>
              </View>
            ) : (
              <View className={styles.uploadArea} onClick={handleChooseImage}>
                <Text className={styles.uploadIcon}>📷</Text>
                <Text className={styles.uploadText}>点击选择图片</Text>
                <Text className={styles.uploadHint}>支持拍照或从相册选择</Text>
              </View>
            )}
            
            <Input
              className={styles.input}
              placeholder="说点什么...（例如：今天食堂的宵夜超棒！）"
              value={shareDescription}
              onInput={(e) => setShareDescription(e.detail.value)}
              maxlength={100}
            />
            
            <View className={styles.actions}>
              <Button className={classnames(styles.btn, styles.cancel)} onClick={handleCancelShare}>
                <Text>取消</Text>
              </Button>
              <Button className={classnames(styles.btn, styles.submit)} onClick={handleSubmitShare}>
                <Text>分享</Text>
              </Button>
            </View>
          </View>
        </View>
      )}

      {showSuccessModal && (
        <View className={styles.successModal}>
          <View className={styles.successContent}>
            <View className={styles.successIconWrap}>
              <Text className={styles.successIcon}>🎉</Text>
            </View>
            <Text className={styles.successTitle}>分享成功！</Text>
            
            <View className={styles.successInfo}>
              <View className={styles.successInfoItem}>
                <Text className={styles.successInfoIcon}>📍</Text>
                <Text className={styles.successInfoLabel}>已加入「</Text>
                <Text className={styles.successInfoValue}>{stageLabels[currentStage]}</Text>
                <Text className={styles.successInfoLabel}>」推荐</Text>
              </View>
              <View className={styles.successInfoItem}>
                <Text className={styles.successInfoIcon}>🏷️</Text>
                <Text className={styles.successInfoLabel}>分类：</Text>
                <Text className={styles.successInfoValue}>能量 ⚡</Text>
              </View>
            </View>

            {switchInfo && (switchInfo.stage || switchInfo.category) ? (
              <View className={styles.switchTip}>
                <Text className={styles.switchTipIcon}>🔄</Text>
                <View className={styles.switchTipTextWrap}>
                  <Text className={styles.switchTipTitle}>已自动调整筛选</Text>
                  <Text className={styles.switchTipDesc}>
                    {switchInfo.stage
                      ? `阶段切换为「${switchInfo.stage}」`
                      : ''}
                    {switchInfo.stage && switchInfo.category ? ' · ' : ''}
                    {switchInfo.category
                      ? `分类切换为「${switchInfo.category}」`
                      : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            <View className={styles.highlightTip}>
              <Text className={styles.highlightTipIcon}>✨</Text>
              <Text className={styles.highlightTipText}>新分享的内容已高亮显示，8秒后自动取消</Text>
            </View>

            <Button
              className={classnames(styles.btn, styles.submit, styles.successBtn)}
              onClick={handleCloseSuccessModal}
            >
              <Text>确认查看</Text>
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RecipesPage;
