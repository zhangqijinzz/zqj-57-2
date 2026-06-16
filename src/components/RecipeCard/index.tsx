import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: (recipe: Recipe) => void;
  isHighlight?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, isHighlight }) => {
  const handleClick = () => {
    console.log('[RecipeCard] 点击食谱:', recipe.id, recipe.name);
    onClick?.(recipe);
  };

  return (
    <View
      className={classnames(styles.card, isHighlight && styles.highlight, recipe.isNew && styles.isNew)}
      onClick={handleClick}
    >
      <View className={styles.cover}>
        <Image
          src={recipe.coverImage}
          mode="aspectFill"
          onError={(e) => console.error('[RecipeCard] 封面加载失败:', e.detail)}
        />
        <Text className={classnames(styles.categoryTag, styles[recipe.category])}>
          {recipe.categoryLabel}
        </Text>
        {recipe.isNew && (
          <View className={styles.newBadge}>
            <Text className={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        <Text className={styles.likes}>❤️ {recipe.likes}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.name}>{recipe.name}</Text>
        <Text className={styles.description}>{recipe.description}</Text>
        <View className={styles.suitableStages}>
          {recipe.suitableStageLabels.map((stage, index) => (
            <Text key={index} className={styles.stageTag}>
              {stage}
            </Text>
          ))}
        </View>
        <View className={styles.footer}>
          {recipe.author ? (
            <View className={styles.author}>
              <Image
                src={recipe.author.avatar}
                mode="aspectFill"
                className={styles.avatar}
                onError={(e) => console.error('[RecipeCard] 作者头像加载失败:', e.detail)}
              />
              <View className={styles.info}>
                <Text className={styles.name}>{recipe.author.name}</Text>
                <Text className={styles.workplace}>{recipe.author.workplace}</Text>
              </View>
            </View>
          ) : (
            <View />
          )}
          <View className={styles.nutrition}>
            <View className={styles.nutritionItem}>
              <Text>🔥</Text>
              <Text className={styles.value}>{recipe.nutrition.calories}</Text>
            </View>
            <View className={styles.nutritionItem}>
              <Text>🥩</Text>
              <Text className={styles.value}>{recipe.nutrition.protein}g</Text>
            </View>
            <View className={styles.nutritionItem}>
              <Text>🍞</Text>
              <Text className={styles.value}>{recipe.nutrition.carbs}g</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RecipeCard;
