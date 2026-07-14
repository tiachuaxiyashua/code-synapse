export const variants = {
  A: { key: 'A', label: '分层数据流', project: 'audio-pipeline' },
  B: { key: 'B', label: '事件驱动', project: 'order-platform' },
  C: { key: 'C', label: '请求与调用', project: 'account-service' },
};

export const featureTrees = {
  A: {
    id: 'audio-root',
    label: '实时音频处理',
    kind: 'capability',
    summary: '分离参考歌曲，提取人声音高，修正麦克风并混音播放。',
    children: [
      { id: 'separation', label: '人声与伴奏分离', kind: 'feature', summary: '把参考歌曲拆成两路音频流。' },
      { id: 'pitch', label: '人声音高提取', kind: 'feature', summary: '按帧估算目标基频与置信度。' },
      { id: 'correction', label: '麦克风音高修正', kind: 'feature', summary: '把麦克风基频修正到目标音高。' },
      { id: 'mix', label: '混音与播放', kind: 'feature', summary: '合并修正人声与伴奏并输出。' },
    ],
  },
  B: {
    id: 'order-root',
    label: '订单履约',
    kind: 'capability',
    summary: '接收订单并通过事件协调库存、支付与通知。',
    children: [
      { id: 'order-create', label: '创建订单', kind: 'feature', summary: '校验请求并持久化初始订单。' },
      { id: 'order-events', label: '发布订单事件', kind: 'feature', summary: '把 OrderPlaced 发送到消息总线。' },
      { id: 'inventory', label: '库存预留', kind: 'feature', summary: '消费事件并锁定库存。' },
      { id: 'payment', label: '支付处理', kind: 'feature', summary: '发起支付并回写结果。' },
      { id: 'recovery', label: '重试与补偿', kind: 'feature', summary: '处理超时、重试和死信。' },
    ],
  },
  C: {
    id: 'account-root',
    label: '用户会话',
    kind: 'capability',
    summary: '处理登录请求、验证身份并建立会话。',
    children: [
      { id: 'login-form', label: '提交登录信息', kind: 'feature', summary: '收集输入并调用登录接口。' },
      { id: 'auth-route', label: '登录接口', kind: 'feature', summary: '完成校验、调用服务并返回响应。' },
      { id: 'auth-service', label: '身份验证', kind: 'feature', summary: '验证密码并读取用户信息。' },
      { id: 'session', label: '创建会话', kind: 'feature', summary: '生成会话并写入缓存。' },
    ],
  },
};

const edge = (id, source, target, label, kind = 'call') => ({
  id,
  source,
  target,
  label,
  type: 'smoothstep',
  animated: kind === 'event',
  className: `edge-${kind}`,
  markerEnd: { type: 'arrowclosed' },
  labelBgPadding: [6, 4],
  labelBgBorderRadius: 3,
  data: { kind },
});

const node = (id, x, y, label, kind, scope = id, extra = {}) => ({
  id,
  position: { x, y },
  type: kind === 'buffer' ? 'buffer' : kind === 'lane' ? 'lane' : 'process',
  data: { label, kind, scope, ...extra },
  ...extra.nodeProps,
});

export function graphFor(variant, scope) {
  if (variant === 'A') {
    if (scope === 'pitch') {
      return {
        title: '人声音高提取 · 内部流程',
        subtitle: '双击任意复合步骤继续下钻；端口显示实际数据契约。',
        nodes: [
          node('frame', 40, 140, '读取人声帧', 'process', 'pitch-frame', { input: 'Vocal RB', output: 'float32[512]' }),
          node('window', 270, 140, '加窗与预处理', 'process', 'pitch-window', { input: 'float32[512]', output: 'windowed[]' }),
          node('fft', 500, 140, '频谱与基频候选', 'process', 'pitch-fft', { input: 'windowed[]', output: 'peaks[]' }),
          node('select', 730, 140, '选择并平滑音高', 'process', 'pitch-select', { input: 'peaks[]', output: 'PitchFrame' }),
          node('pitchOut', 980, 140, 'Pitch RingBuffer', 'buffer', 'pitch-output', { input: 'PitchFrame', output: 'consumer' }),
          node('init', 270, 320, '初始化 FFT / Window / Buffers', 'process', 'pitch-init', { input: 'config', output: 'state' }),
        ],
        edges: [
          edge('e1', 'frame', 'window', 'samples: float32[512]', 'data'),
          edge('e2', 'window', 'fft', 'windowed: float32[512]', 'data'),
          edge('e3', 'fft', 'select', 'candidates: Peak[]', 'data'),
          edge('e4', 'select', 'pitchOut', 'PitchFrame {hz, confidence, ts}', 'data'),
          edge('e5', 'init', 'window', 'windowCoefficients*', 'call'),
          edge('e6', 'init', 'fft', 'fftPlan*', 'call'),
        ],
      };
    }

    if (scope?.startsWith('pitch-')) {
      const leafLabels = {
        'pitch-frame': ['读取人声帧', 'RingBuffer 读取实现'],
        'pitch-window': ['加窗与预处理', '窗口函数实现'],
        'pitch-fft': ['频谱与基频候选', 'FFT 候选提取实现'],
        'pitch-select': ['选择并平滑音高', '候选选择实现'],
        'pitch-init': ['初始化 FFT / Window / Buffers', '初始化实现'],
        'pitch-output': ['Pitch RingBuffer', '输出通道实现'],
      };
      const [featureLabel, implementationLabel] = leafLabels[scope] || ['终端步骤', '函数内部实现'];

      return {
        title: `${featureLabel} · 函数内部`,
        subtitle: '终端层：节点对应不可再分解的语句组；选择节点可查看代码与证据，但不再下钻。',
        terminal: true,
        nodes: [
          node('contract', 70, 160, '校验输入契约', 'process', null, { input: 'typed input', output: 'validated view' }),
          node('prepare', 330, 160, '准备局部状态', 'process', null, { input: 'view + config', output: 'working state' }),
          node('execute', 590, 160, implementationLabel, 'process', null, { input: 'working state', output: 'computed value' }),
          node('result', 850, 160, '构造并返回结果', 'process', null, { input: 'computed value', output: 'typed output' }),
        ],
        edges: [
          edge('leaf-1', 'contract', 'prepare', 'validated data', 'data'),
          edge('leaf-2', 'prepare', 'execute', 'state / references', 'call'),
          edge('leaf-3', 'execute', 'result', 'result + evidence', 'data'),
        ],
      };
    }

    return {
      title: '实时音频处理 · 高层数据流',
      subtitle: '线程是执行分区，RingBuffer 是显式通道；边连接输入/输出端口。',
      nodes: [
        node('laneA', 20, 30, '线程 A · 参考歌曲处理', 'lane', 'separation', { nodeProps: { style: { width: 1040, height: 180, zIndex: -1 } } }),
        node('song', 70, 95, '输入歌曲', 'process', 'song-input', { input: 'file/device', output: 'AudioFrame' }),
        node('separate', 310, 95, '人声 / 伴奏分离', 'process', 'separation', { input: 'AudioFrame', output: 'Vocal + Music' }),
        node('vocalRB', 650, 65, 'Vocal RingBuffer', 'buffer', 'vocal-channel', { input: 'VocalFrame', output: 'reader' }),
        node('musicRB', 650, 130, 'Music RingBuffer', 'buffer', 'music-channel', { input: 'MusicFrame', output: 'reader' }),
        node('laneB', 20, 240, '线程 B · 音高分析与修正', 'lane', 'pitch', { nodeProps: { style: { width: 1040, height: 180, zIndex: -1 } } }),
        node('pitch', 310, 305, '人声音高提取', 'process', 'pitch', { input: 'VocalFrame', output: 'PitchFrame' }),
        node('mic', 70, 360, '麦克风输入', 'process', 'mic-input', { input: 'device', output: 'MicFrame' }),
        node('correct', 650, 305, '麦克风音高修正', 'process', 'correction', { input: 'MicFrame + PitchFrame', output: 'CorrectedFrame' }),
        node('correctedRB', 900, 305, 'Corrected RingBuffer', 'buffer', 'corrected-channel', { input: 'CorrectedFrame', output: 'reader' }),
        node('laneC', 20, 450, '线程 C · 混音与播放', 'lane', 'mix', { nodeProps: { style: { width: 1040, height: 180, zIndex: -1 } } }),
        node('mix', 420, 515, '混音', 'process', 'mix', { input: 'Corrected + Music', output: 'StereoFrame' }),
        node('play', 800, 515, '音频设备输出', 'process', 'playback', { input: 'StereoFrame', output: 'speaker' }),
      ],
      edges: [
        edge('a1', 'song', 'separate', 'AudioFrame<float32>[N]', 'data'),
        edge('a2', 'separate', 'vocalRB', 'VocalFrame · SPSC write', 'data'),
        edge('a3', 'separate', 'musicRB', 'MusicFrame · SPSC write', 'data'),
        edge('a4', 'vocalRB', 'pitch', 'VocalFrame · read', 'data'),
        edge('a5', 'pitch', 'correct', 'PitchFrame {hz, confidence, ts}', 'data'),
        edge('a6', 'mic', 'correct', 'MicFrame<float32>[N]', 'data'),
        edge('a7', 'correct', 'correctedRB', 'CorrectedFrame · write', 'data'),
        edge('a8', 'correctedRB', 'mix', 'CorrectedFrame · read', 'data'),
        edge('a9', 'musicRB', 'mix', 'MusicFrame · read', 'data'),
        edge('a10', 'mix', 'play', 'StereoFrame · deadline 8.33ms', 'data'),
      ],
    };
  }

  if (variant === 'B') {
    return {
      title: '订单履约 · 事件拓扑',
      subtitle: '实线表示已解析注册关系，虚线表示静态候选，动画边表示异步消息。',
      nodes: [
        node('api', 40, 220, 'Order API', 'process', 'order-create', { input: 'CreateOrder', output: 'orderId' }),
        node('producer', 290, 220, 'OrderEventPublisher', 'process', 'order-events', { input: 'Order', output: 'OrderPlaced' }),
        node('topic', 540, 220, 'orders.v2', 'buffer', 'orders-topic', { input: 'OrderPlaced', output: 'fan-out' }),
        node('inventory', 830, 70, 'Inventory Consumer', 'process', 'inventory', { input: 'OrderPlaced', output: 'InventoryReserved' }),
        node('payment', 830, 220, 'Payment Consumer', 'process', 'payment', { input: 'OrderPlaced', output: 'PaymentResult' }),
        node('notify', 830, 370, 'Notification Consumer', 'process', 'notify', { input: 'OrderPlaced', output: 'NotificationSent' }),
        node('retry', 1080, 220, 'Retry / DLQ', 'buffer', 'recovery', { input: 'failed event', output: 'retry event' }),
      ],
      edges: [
        edge('b1', 'api', 'producer', 'Order persisted', 'call'),
        edge('b2', 'producer', 'topic', 'publish OrderPlaced v2', 'event'),
        edge('b3', 'topic', 'inventory', 'consume group inventory', 'event'),
        edge('b4', 'topic', 'payment', 'consume group payment', 'event'),
        edge('b5', 'topic', 'notify', 'consume group notification', 'event'),
        edge('b6', 'payment', 'retry', 'timeout / nack', 'event'),
        edge('b7', 'retry', 'topic', 'retry with backoff', 'event'),
      ],
    };
  }

  return {
    title: '用户登录 · 请求与调用',
    subtitle: '业务主路径默认展开；框架、中间件和低价值调用可折叠。',
    nodes: [
      node('browser', 40, 220, 'LoginForm', 'process', 'login-form', { input: 'email/password', output: 'POST /login' }),
      node('route', 300, 220, 'POST /api/login', 'process', 'auth-route', { input: 'LoginRequest', output: 'Response' }),
      node('middleware', 560, 70, 'Validation Middleware', 'process', 'validation', { input: 'request', output: 'validated' }),
      node('service', 560, 220, 'AuthService.login', 'process', 'auth-service', { input: 'credentials', output: 'User' }),
      node('repo', 820, 220, 'UserRepository', 'process', 'user-repo', { input: 'email', output: 'UserRecord' }),
      node('session', 560, 380, 'SessionService.create', 'process', 'session', { input: 'userId', output: 'sessionId' }),
      node('redis', 820, 380, 'Redis', 'buffer', 'session-store', { input: 'Session', output: 'lookup' }),
    ],
    edges: [
      edge('c1', 'browser', 'route', 'LoginRequest', 'call'),
      edge('c2', 'route', 'middleware', 'request', 'call'),
      edge('c3', 'route', 'service', 'validated credentials', 'call'),
      edge('c4', 'service', 'repo', 'email: string', 'call'),
      edge('c5', 'service', 'session', 'userId: UUID', 'call'),
      edge('c6', 'session', 'redis', 'Session TTL=7d', 'data'),
      edge('c7', 'session', 'route', 'sessionId', 'call'),
    ],
  };
}

export const timelineRows = {
  A: [
    { id: 'irq', label: 'Hardware IRQ', slices: [{ id: 'tick', start: 0, end: 0.18, label: 't0+nT', tone: 'danger' }] },
    { id: 'thread-a', label: 'Thread A', slices: [{ id: 'separation', start: 0.3, end: 3.1, label: 'separate()', scope: 'separation' }, { id: 'write-vocal', start: 3.25, end: 3.8, label: 'write Vocal RB', scope: 'vocal-channel', tone: 'data' }] },
    { id: 'thread-b', label: 'Thread B', slices: [{ id: 'read-vocal', start: 3.9, end: 4.3, label: 'read Vocal RB', scope: 'vocal-channel', tone: 'data' }, { id: 'pitch', start: 4.4, end: 6.2, label: 'pitch()', scope: 'pitch' }, { id: 'correct', start: 6.25, end: 7.4, label: 'correct()', scope: 'correction' }] },
    { id: 'thread-c', label: 'Thread C', slices: [{ id: 'mix', start: 7.45, end: 8.5, label: 'mix()', scope: 'mix' }, { id: 'device', start: 8.6, end: 9.45, label: 'device.write()', scope: 'playback' }] },
    { id: 'rb-fill', label: 'RB fill level', counter: [18, 38, 76, 52, 24, 61, 35, 12] },
  ],
  B: [
    { id: 'api', label: 'Order API', slices: [{ id: 'create', start: 0.2, end: 1.5, label: 'create order', scope: 'order-create' }, { id: 'publish', start: 1.55, end: 2.1, label: 'publish', scope: 'order-events', tone: 'event' }] },
    { id: 'broker', label: 'Kafka orders.v2', slices: [{ id: 'broker', start: 2.1, end: 3.4, label: 'persist + fanout', scope: 'orders-topic', tone: 'event' }] },
    { id: 'inventory', label: 'Inventory', slices: [{ id: 'reserve', start: 3.5, end: 6.1, label: 'reserve inventory', scope: 'inventory' }] },
    { id: 'payment', label: 'Payment', slices: [{ id: 'charge', start: 3.6, end: 7.4, label: 'charge', scope: 'payment' }, { id: 'timeout', start: 7.5, end: 8.2, label: 'timeout', scope: 'recovery', tone: 'danger' }] },
    { id: 'retry', label: 'Retry worker', slices: [{ id: 'backoff', start: 8.35, end: 9.7, label: 'backoff', scope: 'recovery', tone: 'event' }] },
  ],
  C: [
    { id: 'browser', label: 'Browser', slices: [{ id: 'submit', start: 0.2, end: 1.1, label: 'submit login', scope: 'login-form' }] },
    { id: 'server', label: 'API server', slices: [{ id: 'route', start: 1.2, end: 7.9, label: 'POST /login', scope: 'auth-route' }] },
    { id: 'service', label: 'AuthService', slices: [{ id: 'auth', start: 2.0, end: 5.8, label: 'verify password', scope: 'auth-service' }] },
    { id: 'database', label: 'Postgres', slices: [{ id: 'query', start: 2.5, end: 4.1, label: 'SELECT user', scope: 'user-repo', tone: 'data' }] },
    { id: 'cache', label: 'Redis', slices: [{ id: 'session', start: 6.1, end: 7.2, label: 'SET session', scope: 'session-store', tone: 'data' }] },
  ],
};

export const layerData = {
  A: [
    { label: '功能编排层', modules: ['AudioPipeline', 'SessionController'] },
    { label: 'DSP 领域层', modules: ['Separation', 'PitchEstimator', 'PitchCorrector', 'Mixer'] },
    { label: '数据与并发层', modules: ['AudioFrame', 'RingBuffer', 'FrameClock'] },
    { label: '平台与设备层', modules: ['MicInput', 'AudioDevice', 'ISR', 'GlobalClock'] },
  ],
  B: [
    { label: '业务能力层', modules: ['OrderFulfillment', 'RecoveryPolicy'] },
    { label: '事件处理层', modules: ['Producer', 'InventoryConsumer', 'PaymentConsumer'] },
    { label: '消息基础设施', modules: ['Kafka', 'SchemaRegistry', 'DLQ'] },
    { label: '数据与外部服务', modules: ['OrderDB', 'InventoryAPI', 'PaymentGateway'] },
  ],
  C: [
    { label: '界面与接口层', modules: ['LoginForm', 'LoginRoute'] },
    { label: '应用服务层', modules: ['AuthService', 'SessionService'] },
    { label: '领域与策略层', modules: ['PasswordPolicy', 'SessionPolicy'] },
    { label: '基础设施层', modules: ['UserRepository', 'Postgres', 'Redis'] },
  ],
};

export const codeExamples = {
  A: {
    title: 'estimatePitch',
    path: 'src/dsp/pitch/estimatePitch.ts:42',
    purpose: '从一帧人声音频中估算基频，并输出置信度。',
    code: `/**\n * @code_synapse.feature pitch-extraction\n * @code_synapse.purpose Estimate vocal fundamental frequency\n * @code_synapse.input samples: float32[N], sampleRate: Hz\n * @code_synapse.output PitchFrame { hz, confidence, timestamp }\n */\nexport function estimatePitch(samples, sampleRate) {\n  const windowed = applyHannWindow(samples);\n  const spectrum = fft(windowed);\n  const peaks = findHarmonicPeaks(spectrum, sampleRate);\n  return selectFundamental(peaks);\n}`,
  },
  B: {
    title: 'onOrderPlaced',
    path: 'src/inventory/consumer.ts:31',
    purpose: '消费订单事件并预留库存；失败时交给重试策略。',
    code: `/**\n * @code_synapse.feature inventory-reservation\n * @code_synapse.trigger event:orders.v2/OrderPlaced\n * @code_synapse.sideEffect inventory.reserved\n */\nexport async function onOrderPlaced(event) {\n  const reservation = await inventory.reserve(event.items);\n  await events.publish('InventoryReserved', reservation);\n}`,
  },
  C: {
    title: 'createSession',
    path: 'src/auth/session.ts:42',
    purpose: '建立服务端会话并返回浏览器需要的 sessionId。',
    code: `/**\n * @code_synapse.feature user-session\n * @code_synapse.purpose Persist an authenticated user session\n * @code_synapse.input userId: UUID\n * @code_synapse.output sessionId: string\n */\nexport async function createSession(userId) {\n  const session = Session.create(userId);\n  await redis.set(session.id, session, { ttl: '7d' });\n  return session.id;\n}`,
  },
};
