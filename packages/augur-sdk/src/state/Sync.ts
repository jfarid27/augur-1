import { WarpController } from '../warp/WarpController';
import { API } from './getter/API';
import { create } from './create-api';
import { UploadBlockNumbers } from '@augurproject/artifacts';
import { WarpSyncStrategy } from './sync/WarpSyncStrategy';

export async function start(ethNodeUrl: string, account?: string, enableFlexSearch = false, hashAddress?: string): Promise<API> {
  const { api, bulkSyncStrategy, logFilterAggregator} = await create(ethNodeUrl, account, enableFlexSearch);

  const networkId = await api.augur.provider.getNetworkId();
  const uploadBlockNumber = UploadBlockNumbers[networkId];
  const currentBlockNumber = await api.augur.provider.getBlockNumber();
  const warpController = await WarpController.create((await api.db));

  const warpSyncStrategy = new WarpSyncStrategy(warpController, logFilterAggregator.onLogsAdded)

  console.log('hashAddress', hashAddress);
  const endWarpSyncBlock = await warpSyncStrategy.start('Qmbvh6JFySmHWop6qGpPKQfdoDmG3DXVv4b3u2MeiFYibt/index');
  await bulkSyncStrategy.start(endWarpSyncBlock || uploadBlockNumber, currentBlockNumber);

  await warpController.createAllCheckpoints();

  return api;
}
