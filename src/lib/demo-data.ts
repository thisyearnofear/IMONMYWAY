import type { AgentActivityEvent } from './somnia-reactivity';

export const DEMO_AGENT = '0x24D16d61De02c29706c51C7a473410a88BF44663';

export const DEMO_TXNS = {
  deploy: 'https://shannon-explorer.somnia.network/tx/0xca0303d7a34803aa2c62eb137471f382b2f088ed00635c1ce94e42727b99002c',
  subscribe: 'https://shannon-explorer.somnia.network/tx/0xde2d9b8c579384aad8aa028731144c1e20204b8c7902975859749d6cf2a7109a',
  authorize: 'https://shannon-explorer.somnia.network/tx/0x404cd3e228376fd2c81606a7278a5070cf6a0fe7cb269ed23f7f4f61b497353b',
  initiate: 'https://shannon-explorer.somnia.network/tx/0x17e4d2e3f9c568413366f7b1bfcff3880bc6001fe7d87a74e3b89ec445e0a1fe',
  callback: 'https://shannon-explorer.somnia.network/tx/0xdd15a03d3a42161a6c5a0d2e15f3e75311c95ae0e5e5385e904b719331f27f79',
};

export const DEMO_EVENTS: AgentActivityEvent[] = [
  {
    type: 'system',
    commitmentId: '0xca0303d7a34803aa2c62eb137471f382b2f088ed00635c1ce94e42727b99002c',
    timestamp: 1741088000,
    data: { step: 1, label: 'Agent Deployed', tx: DEMO_TXNS.deploy },
  },
  {
    type: 'system',
    commitmentId: '0xde2d9b8c579384aad8aa028731144c1e20204b8c7902975859749d6cf2a7109a',
    timestamp: 1741088050,
    data: { step: 2, label: 'Reactivity Subscription Activated', tx: DEMO_TXNS.subscribe },
  },
  {
    type: 'system',
    commitmentId: '0x404cd3e228376fd2c81606a7278a5070cf6a0fe7cb269ed23f7f4f61b497353b',
    timestamp: 1741088100,
    data: { step: 3, label: 'Deployer Authorized', tx: DEMO_TXNS.authorize },
  },
  {
    type: 'decision',
    commitmentId: '0x2c0def8b2c533c845a09d7eddbf3f3200c59a448e25155f78e0f9e186e99e31b',
    timestamp: 1741088950,
    data: {
      requestId: '24391',
      requestType: 'llm_pace_decision',
      decision: 'Pace: 200 sec/km, Stake: 0.5 STT',
      reasoning: 'AGENT: urgency=urgent, traffic=moderate, distance=short. Target pace 200 sec/km (3 min 20 sec per km). This is a realistic pace for an urgent short-distance urban route with moderate traffic.',
    },
  },
  {
    type: 'commitment_created',
    commitmentId: '0x2c0def8b2c533c845a09d7eddbf3f3200c59a448e25155f78e0f9e186e99e31b',
    timestamp: 1741089000,
    data: {
      principal: '0x437D081d1Cfa5e5E30FE8E364f84b25904c8ebAc',
      pace: '200',
      reasoning: 'Pace 200 sec/km — On-chain commitment created from LLM decision. Staked 0.5 STT. Deadline set 5 min from now.',
    },
  },
  {
    type: 'commitment_settled',
    commitmentId: '0x2c0def8b2c533c845a09d7eddbf3f3200c59a448e25155f78e0f9e186e99e31b',
    timestamp: 1741089500,
    data: {
      success: true,
      reasoning: 'Settled automatically via Schedule subscription at deadline. No keeper, no cron — the chain woke itself up.',
    },
  },
];
