export default defineAppConfig({
  pages: [
    'pages/countdown/index',
    'pages/circle/index',
    'pages/games/index',
    'pages/recipes/index',
    'pages/worker-detail/index',
    'pages/game-detail/index',
    'pages/recipe-detail/index',
    'pages/achievement/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E293B',
    navigationBarTitleText: '夜班工友能量站',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0F172A'
  },
  tabBar: {
    color: '#64748B',
    selectedColor: '#6366F1',
    backgroundColor: '#1E293B',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/countdown/index',
        text: '倒计时'
      },
      {
        pagePath: 'pages/circle/index',
        text: '工友圈'
      },
      {
        pagePath: 'pages/games/index',
        text: '小游戏'
      },
      {
        pagePath: 'pages/recipes/index',
        text: '食谱'
      }
    ]
  }
})
