import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, useDidHide, useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { games } from '@/data/games';
import { useGameStore } from '@/store/useGameStore';
import type { LeaderboardEntry, SavedGameState } from '@/types';

type GamePhase = 'detail' | 'countdown' | 'playing' | 'paused' | 'result';

interface Target {
  id: string;
  x: number;
  y: number;
  icon: string;
  createdAt: number;
  lifetime: number;
  hit: boolean;
  expired: boolean;
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  easy: { label: '简单', color: '#22C55E' },
  medium: { label: '中等', color: '#F59E0B' },
  hard: { label: '困难', color: '#EF4444' },
};

const GAME_BG_COLORS = [
  'rgba(99, 102, 241, 0.15)',
  'rgba(245, 158, 11, 0.15)',
  'rgba(34, 197, 94, 0.15)',
  'rgba(239, 68, 68, 0.15)',
  'rgba(168, 85, 247, 0.15)',
  'rgba(6, 182, 212, 0.15)',
];

const GameDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;

  const game = games.find((g) => g.id === id);
  const bgColor = GAME_BG_COLORS[(parseInt(id || '1') - 1) % GAME_BG_COLORS.length];

  const {
    getLeaderboard,
    getMyBest,
    submitScore,
    retryPendingScores,
    refreshLeaderboard,
    saveGameState,
    loadGameState,
    clearGameState,
    getPendingCount,
  } = useGameStore();

  const [phase, setPhase] = useState<GamePhase>('detail');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [countdownNum, setCountdownNum] = useState(3);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myBest, setMyBest] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [rankChange, setRankChange] = useState<{ direction: 'up' | 'down' | 'same'; diff: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scorePopups, setScorePopups] = useState<{ id: string; x: number; y: number; value: number; combo: number }[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [showPendingTip, setShowPendingTip] = useState(false);

  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expireTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);
  const targetIdRef = useRef(0);
  const popupIdRef = useRef(0);
  const isPausedRef = useRef(false);
  const phaseRef = useRef<GamePhase>('detail');

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (expireTimerRef.current) clearInterval(expireTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    gameTimerRef.current = null;
    spawnTimerRef.current = null;
    expireTimerRef.current = null;
    countdownTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (!id) return;
    const lb = getLeaderboard(id);
    setLeaderboard(lb);
    const best = getMyBest(id);
    setMyBest(best);
    const pending = getPendingCount(id);
    setPendingCount(pending);
    if (pending > 0) {
      setShowPendingTip(true);
      retryPendingScores(id);
      setTimeout(() => {
        setLeaderboard(getLeaderboard(id));
        setMyBest(getMyBest(id));
        setPendingCount(getPendingCount(id));
        if (getPendingCount(id) === 0) {
          setShowPendingTip(false);
        }
      }, 500);
    }
  }, [id]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const generateTarget = useCallback(
    (existingTargets: Target[]): Target => {
      if (!game) return { id: '0', x: 50, y: 50, icon: '⭐', createdAt: Date.now(), lifetime: 2000, hit: false, expired: false };

      const margin = 12;
      let x = 0;
      let y = 0;
      let attempts = 0;
      do {
        x = margin + Math.random() * (100 - 2 * margin);
        y = margin + Math.random() * (100 - 2 * margin);
        attempts++;
      } while (attempts < 20 && existingTargets.some((t) => !t.hit && !t.expired && Math.abs(t.x - x) < 18 && Math.abs(t.y - y) < 18));

      const icons = game.targetIcons;
      const icon = icons[Math.floor(Math.random() * icons.length)];

      targetIdRef.current += 1;

      return {
        id: `${targetIdRef.current}`,
        x,
        y,
        icon,
        createdAt: Date.now(),
        lifetime: game.playConfig.targetLifetime,
        hit: false,
        expired: false,
      };
    },
    [game]
  );

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdownNum(3);
    clearAllTimers();

    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        startGame();
      } else {
        setCountdownNum(count);
      }
    }, 1000);
  }, []);

  const startGame = useCallback(() => {
    if (!game) return;
    clearAllTimers();

    setPhase('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(game.playConfig.duration);
    setTargets([]);
    setScorePopups([]);
    isPausedRef.current = false;
    gameStartTimeRef.current = Date.now();

    gameTimerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0) {
          endGame();
          return 0;
        }
        return Math.round(next * 10) / 10;
      });
    }, 100);

    spawnTimerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      setTargets((prev) => {
        const active = prev.filter((t) => !t.hit && !t.expired);
        if (active.length >= game.playConfig.maxTargets) return prev;
        const newTarget = generateTarget(prev);
        return [...prev, newTarget];
      });
    }, game.playConfig.spawnInterval);

    expireTimerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      const now = Date.now();
      setTargets((prev) => {
        let comboBroken = false;
        const updated = prev.map((t) => {
          if (!t.hit && !t.expired && now - t.createdAt >= t.lifetime) {
            comboBroken = true;
            return { ...t, expired: true };
          }
          return t;
        });
        if (comboBroken) {
          setCombo(0);
        }
        return updated.filter((t) => !t.expired || now - t.createdAt < t.lifetime + 500);
      });
    }, 100);

    setTimeout(() => {
      setTargets([generateTarget([])]);
    }, 300);
  }, [game, generateTarget, clearAllTimers]);

  const endGame = useCallback(() => {
    clearAllTimers();
    setPhase('result');

    if (!id) return;
    const currentBest = getMyBest(id);
    setIsNewRecord(score > currentBest && score > 0);

    const success = submitScore(id, score);
    if (!success) {
      Taro.showToast({ title: '分数暂存中，稍后重试', icon: 'none' });
    }

    setTimeout(() => {
      setLeaderboard(getLeaderboard(id));
      setMyBest(getMyBest(id));
    }, 200);
  }, [id, score, clearAllTimers]);

  const handleTargetTap = useCallback(
    (targetId: string, targetX: number, targetY: number) => {
      if (phaseRef.current !== 'playing' || isPausedRef.current) return;

      setTargets((prev) =>
        prev.map((t) => (t.id === targetId ? { ...t, hit: true } : t))
      );

      setCombo((prev) => {
        const newCombo = prev + 1;
        setMaxCombo((mc) => Math.max(mc, newCombo));
        return newCombo;
      });

      const config = game?.playConfig;
      if (!config) return;

      const comboVal = combo + 1;
      const earned = config.pointsPerHit + comboVal * config.comboStep;

      setScore((prev) => prev + earned);

      popupIdRef.current += 1;
      setScorePopups((prev) => [
        ...prev,
        { id: `${popupIdRef.current}`, x: targetX, y: targetY, value: earned, combo: comboVal },
      ]);

      setTimeout(() => {
        setScorePopups((prev) => prev.filter((p) => p.id !== `${popupIdRef.current - 1}` || prev.length <= 5));
      }, 800);

      try {
        Taro.vibrateShort({ type: 'light' });
      } catch (_e) {
        // ignore
      }

      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== targetId));
      }, 200);
    },
    [game, combo]
  );

  const pauseGame = useCallback(() => {
    isPausedRef.current = true;
    pauseTimeRef.current = Date.now();
    setPhase('paused');

    if (id) {
      const state: SavedGameState = {
        gameId: id,
        score,
        combo,
        timeLeft,
        pausedAt: Date.now(),
        phase: 'playing',
      };
      saveGameState(state);
    }
  }, [id, score, combo, timeLeft, saveGameState]);

  const resumeGame = useCallback(() => {
    const pauseDuration = (Date.now() - pauseTimeRef.current) / 1000;
    const fiveMinutes = 300;

    if (pauseDuration > fiveMinutes) {
      Taro.showModal({
        title: '游戏已超时',
        content: '离开时间过长，游戏已结束',
        showCancel: false,
        confirmText: '查看结果',
        success: () => {
          endGame();
        },
      });
      return;
    }

    isPausedRef.current = false;
    pauseTimeRef.current = 0;
    setPhase('playing');

    if (id) {
      clearGameState(id);
    }
  }, [id, endGame, clearGameState]);

  const quitGame = useCallback(() => {
    clearAllTimers();
    setPhase('detail');
    setTargets([]);
    setScorePopups([]);
    isPausedRef.current = false;

    if (id) {
      clearGameState(id);
    }
  }, [id, clearAllTimers, clearGameState]);

  const handleStartGame = useCallback(() => {
    if (!game) return;
    const savedState = loadGameState(id || '');
    if (savedState && savedState.phase === 'playing') {
      const elapsed = (Date.now() - savedState.pausedAt) / 1000;
      if (elapsed < 300 && savedState.timeLeft > 0) {
        Taro.showModal({
          title: '恢复游戏',
          content: `检测到上次未完成的游戏，剩余 ${Math.ceil(savedState.timeLeft)} 秒，是否继续？`,
          confirmText: '继续',
          cancelText: '重新开始',
          success: (res) => {
            if (res.confirm) {
              setPhase('playing');
              setScore(savedState.score);
              setCombo(savedState.combo);
              setTimeLeft(savedState.timeLeft);
              setTargets([]);
              setScorePopups([]);
              isPausedRef.current = false;
              gameStartTimeRef.current = Date.now();
              clearGameState(id || '');

              gameTimerRef.current = setInterval(() => {
                if (isPausedRef.current) return;
                setTimeLeft((prev) => {
                  const next = Math.max(0, prev - 0.1);
                  if (next <= 0) {
                    endGame();
                    return 0;
                  }
                  return Math.round(next * 10) / 10;
                });
              }, 100);

              spawnTimerRef.current = setInterval(() => {
                if (isPausedRef.current) return;
                setTargets((prev) => {
                  const active = prev.filter((t) => !t.hit && !t.expired);
                  if (active.length >= game.playConfig.maxTargets) return prev;
                  const newTarget = generateTarget(prev);
                  return [...prev, newTarget];
                });
              }, game.playConfig.spawnInterval);

              expireTimerRef.current = setInterval(() => {
                if (isPausedRef.current) return;
                const now = Date.now();
                setTargets((prev) => {
                  let comboBroken = false;
                  const updated = prev.map((t) => {
                    if (!t.hit && !t.expired && now - t.createdAt >= t.lifetime) {
                      comboBroken = true;
                      return { ...t, expired: true };
                    }
                    return t;
                  });
                  if (comboBroken) {
                    setCombo(0);
                  }
                  return updated.filter((t) => !t.expired || now - t.createdAt < t.lifetime + 500);
                });
              }, 100);

              setTimeout(() => {
                setTargets([generateTarget([])]);
              }, 300);
            } else {
              startCountdown();
            }
          },
        });
        return;
      }
    }
    startCountdown();
  }, [game, id, loadGameState, clearGameState, startCountdown, endGame, generateTarget]);

  const handleRefreshLeaderboard = useCallback(() => {
    if (!id || isRefreshing) return;
    setIsRefreshing(true);
    const result = refreshLeaderboard(id);

    setTimeout(() => {
      const lb = getLeaderboard(id);
      setLeaderboard(lb);
      setIsRefreshing(false);

      if (result.oldRank !== result.newRank && myBest > 0) {
        const diff = result.oldRank - result.newRank;
        setRankChange({
          direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
          diff: Math.abs(diff),
        });
        setTimeout(() => setRankChange(null), 3000);
      }
    }, 800);
  }, [id, isRefreshing, refreshLeaderboard, getLeaderboard, myBest]);

  useDidHide(() => {
    if (phaseRef.current === 'playing') {
      pauseGame();
    }
  });

  useDidShow(() => {
    if (phaseRef.current === 'paused') {
      Taro.showModal({
        title: '欢迎回来',
        content: '游戏已暂停，是否继续？',
        confirmText: '继续游戏',
        cancelText: '退出游戏',
        success: (res) => {
          if (res.confirm) {
            resumeGame();
          } else {
            quitGame();
          }
        },
      });
    }
  });

  if (!game) {
    return (
      <View className={styles.page}>
        <View className={styles.notFound}>
          <Text className={styles.notFoundIcon}>🎮</Text>
          <Text className={styles.notFoundText}>游戏不存在</Text>
        </View>
      </View>
    );
  }

  const diffInfo = DIFFICULTY_MAP[game.difficulty];
  const top3 = leaderboard.slice(0, 3);
  const myRank = leaderboard.find((e) => e.isCurrentUser);

  return (
    <View className={styles.page}>
      {phase === 'detail' && (
        <ScrollView className={styles.detailScroll} scrollY>
          <View className={styles.coverWrap}>
            <Image className={styles.coverImage} src={game.coverImage} mode="aspectFill" />
            <View className={styles.coverOverlay} />
            <View className={styles.coverInfo}>
              <Text className={styles.gameName}>{game.name}</Text>
              <View className={styles.tags}>
                <View className={styles.tag} style={{ backgroundColor: diffInfo.color }}>
                  <Text className={styles.tagText}>{diffInfo.label}</Text>
                </View>
                <View className={styles.tag} style={{ backgroundColor: 'rgba(99,102,241,0.8)' }}>
                  <Text className={styles.tagText}>{game.category}</Text>
                </View>
                <View className={styles.tag} style={{ backgroundColor: 'rgba(148,163,184,0.7)' }}>
                  <Text className={styles.tagText}>⏱ 约{game.estimatedTime}分钟</Text>
                </View>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>玩法简介</Text>
            <Text className={styles.gameDesc}>{game.description}</Text>
            <View className={styles.playInfo}>
              <View className={styles.playInfoItem}>
                <Text className={styles.playInfoLabel}>游戏时长</Text>
                <Text className={styles.playInfoValue}>{game.playConfig.duration}秒</Text>
              </View>
              <View className={styles.playInfoItem}>
                <Text className={styles.playInfoLabel}>目标上限</Text>
                <Text className={styles.playInfoValue}>{game.playConfig.maxTargets}个</Text>
              </View>
              <View className={styles.playInfoItem}>
                <Text className={styles.playInfoLabel}>基础得分</Text>
                <Text className={styles.playInfoValue}>{game.playConfig.pointsPerHit}分</Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>🏆 我的最高分</Text>
            </View>
            <View className={styles.myBestCard}>
              <Text className={styles.myBestScore}>{myBest > 0 ? myBest : '--'}</Text>
              <Text className={styles.myBestLabel}>{myBest > 0 ? `排名第 ${myRank?.rank || '-'}` : '暂无记录'}</Text>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>📊 排行榜 TOP3</Text>
              <View
                className={classnames(styles.refreshBtn, isRefreshing && styles.refreshing)}
                onClick={handleRefreshLeaderboard}
              >
                <Text className={styles.refreshIcon}>{isRefreshing ? '⏳' : '🔄'}</Text>
              </View>
            </View>

            {rankChange && (
              <View
                className={classnames(
                  styles.rankChangeBar,
                  rankChange.direction === 'up' && styles.rankUp,
                  rankChange.direction === 'down' && styles.rankDown
                )}
              >
                <Text className={styles.rankChangeText}>
                  {rankChange.direction === 'up'
                    ? `🎉 排名上升 ${rankChange.diff} 位！`
                    : `📉 排名下降 ${rankChange.diff} 位`}
                </Text>
              </View>
            )}

            {showPendingTip && (
              <View className={styles.pendingBar}>
                <Text className={styles.pendingText}>有 {pendingCount} 条分数待提交</Text>
              </View>
            )}

            <View className={styles.leaderboard}>
              {top3.map((entry, idx) => (
                <View
                  key={entry.rank}
                  className={classnames(styles.lbRow, entry.isCurrentUser && styles.lbRowMe)}
                >
                  <View className={styles.lbRank}>
                    <Text className={styles.lbRankIcon}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </Text>
                  </View>
                  <View className={styles.lbAvatar}>
                    <Text className={styles.lbAvatarIcon}>{entry.avatar}</Text>
                  </View>
                  <Text className={classnames(styles.lbName, entry.isCurrentUser && styles.lbNameMe)}>
                    {entry.name}
                  </Text>
                  <Text className={styles.lbScore}>{entry.score}</Text>
                </View>
              ))}
              {top3.length === 0 && (
                <View className={styles.lbEmpty}>
                  <Text className={styles.lbEmptyText}>暂无排行数据</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.startBtnWrap}>
            <View className={styles.startBtn} onClick={handleStartGame}>
              <Text className={styles.startBtnText}>🎮 开始游戏</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {phase === 'countdown' && (
        <View className={styles.overlay}>
          <View className={styles.countdownContainer}>
            <Text className={styles.countdownNumber}>{countdownNum}</Text>
            <Text className={styles.countdownHint}>准备!</Text>
          </View>
        </View>
      )}

      {phase === 'playing' && (
        <View className={styles.overlay}>
          <View className={styles.gameTopBar}>
            <View className={styles.gameStat}>
              <Text className={styles.gameStatLabel}>⏱</Text>
              <Text className={classnames(styles.gameStatValue, timeLeft <= 5 && styles.timeWarning)}>
                {Math.ceil(timeLeft)}s
              </Text>
            </View>
            <View className={styles.gameStat}>
              <Text className={styles.gameStatLabel}>⭐</Text>
              <Text className={styles.gameStatValue}>{score}</Text>
            </View>
            <View className={styles.gameStat}>
              <Text className={styles.gameStatLabel}>🔥</Text>
              <Text className={classnames(styles.gameStatValue, combo >= 3 && styles.comboActive)}>
                x{combo}
              </Text>
            </View>
            <View className={styles.pauseBtn} onClick={pauseGame}>
              <Text className={styles.pauseBtnText}>⏸</Text>
            </View>
          </View>

          <View className={styles.gameArea} style={{ backgroundColor: bgColor }}>
            {targets
              .filter((t) => !t.hit && !t.expired)
              .map((target) => {
                const elapsed = Date.now() - target.createdAt;
                const progress = Math.min(1, elapsed / target.lifetime);
                const scale = 1 - progress * 0.5;
                const opacity = 1 - progress * 0.6;
                return (
                  <View
                    key={target.id}
                    className={styles.target}
                    style={{
                      left: `${target.x}%`,
                      top: `${target.y}%`,
                      transform: `translate(-50%, -50%) scale(${scale})`,
                      opacity,
                    }}
                    onClick={() => handleTargetTap(target.id, target.x, target.y)}
                  >
                    <Text className={styles.targetIcon}>{target.icon}</Text>
                    <View
                      className={styles.targetRing}
                      style={{
                        borderWidth: `${4 * (1 - progress)}rpx`,
                      }}
                    />
                  </View>
                );
              })}
            {scorePopups.map((popup) => (
              <View
                key={popup.id}
                className={styles.scorePopup}
                style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
              >
                <Text className={styles.scorePopupValue}>+{popup.value}</Text>
                {popup.combo >= 3 && (
                  <Text className={styles.scorePopupCombo}>x{popup.combo}</Text>
                )}
              </View>
            ))}
          </View>

          <View className={styles.gameBottomBar}>
            <Text className={styles.gameBottomHint}>点击出现的目标得分，连续命中获得连击加成!</Text>
          </View>
        </View>
      )}

      {phase === 'paused' && (
        <View className={styles.overlay}>
          <View className={styles.pauseOverlay}>
            <Text className={styles.pauseTitle}>游戏暂停</Text>
            <Text className={styles.pauseScore}>当前得分: {score}</Text>
            <Text className={styles.pauseTime}>剩余时间: {Math.ceil(timeLeft)}s</Text>
            <View className={styles.pauseActions}>
              <View className={styles.resumeBtn} onClick={resumeGame}>
                <Text className={styles.resumeBtnText}>▶ 继续游戏</Text>
              </View>
              <View className={styles.quitBtn} onClick={quitGame}>
                <Text className={styles.quitBtnText}>退出游戏</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {phase === 'result' && (
        <View className={styles.overlay}>
          <View className={styles.resultContainer}>
            {isNewRecord && (
              <View className={styles.newRecordBadge}>
                <Text className={styles.newRecordText}>🏆 新纪录!</Text>
              </View>
            )}
            <Text className={styles.resultTitle}>游戏结束</Text>
            <Text className={styles.resultScore}>{score}</Text>
            <Text className={styles.resultLabel}>最终得分</Text>

            <View className={styles.resultStats}>
              <View className={styles.resultStatItem}>
                <Text className={styles.resultStatValue}>x{maxCombo}</Text>
                <Text className={styles.resultStatLabel}>最高连击</Text>
              </View>
              <View className={styles.resultStatItem}>
                <Text className={styles.resultStatValue}>{myBest}</Text>
                <Text className={styles.resultStatLabel}>历史最高</Text>
              </View>
              <View className={styles.resultStatItem}>
                <Text className={styles.resultStatValue}>#{myRank?.rank || '-'}</Text>
                <Text className={styles.resultStatLabel}>当前排名</Text>
              </View>
            </View>

            <View className={styles.resultActions}>
              <View className={styles.replayBtn} onClick={startCountdown}>
                <Text className={styles.replayBtnText}>🔄 再来一局</Text>
              </View>
              <View className={styles.backBtn} onClick={() => {
                setPhase('detail');
                if (id) {
                  setLeaderboard(getLeaderboard(id));
                  setMyBest(getMyBest(id));
                }
              }}>
                <Text className={styles.backBtnText}>返回详情</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default GameDetailPage;
