import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';

const GameDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;

  useDidShow(() => {
    console.log('[GameDetailPage] 页面显示，游戏ID:', id);
  });

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.placeholder}>
        <Text className={styles.icon}>🎮</Text>
        <Text className={styles.title}>游戏详情</Text>
        <Text className={styles.desc}>
          游戏介绍、开始游戏、排行榜等功能
          {'\n'}
          正在开发中...
        </Text>
      </View>
    </ScrollView>
  );
};

export default GameDetailPage;
