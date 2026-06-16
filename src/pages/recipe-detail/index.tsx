import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';

const RecipeDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;

  useDidShow(() => {
    console.log('[RecipeDetailPage] 页面显示，食谱ID:', id);
  });

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.placeholder}>
        <Text className={styles.icon}>🍳</Text>
        <Text className={styles.title}>食谱详情</Text>
        <Text className={styles.desc}>
          食谱详细做法、营养分析、工友评论等功能
          {'\n'}
          正在开发中...
        </Text>
      </View>
    </ScrollView>
  );
};

export default RecipeDetailPage;
