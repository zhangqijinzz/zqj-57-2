import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import styles from './index.module.scss';

const WorkerDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;

  useDidShow(() => {
    console.log('[WorkerDetailPage] 页面显示，工友ID:', id);
  });

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.placeholder}>
        <Text className={styles.icon}>👷</Text>
        <Text className={styles.title}>工友详情</Text>
        <Text className={styles.desc}>
          工友个人信息、历史留言、发起聊天等功能
          {'\n'}
          正在开发中...
        </Text>
      </View>
    </ScrollView>
  );
};

export default WorkerDetailPage;
