import client from '../helpers/client';

export function getLiteTraceBridge() {
  return client('cms/data/litetrace_bridges');
}

export function deleteLiteTraceBridge(id) {
  return client(`cms/data/litetrace_bridges/${id}`, 'DELETE');
}

export function postLiteTraceBridge(body) {
  return client('cms/data/litetrace_bridges', 'POST', body);
}

export function putLiteTraceBridge(id, body) {
  return client(`cms/data/litetrace_bridges/${id}`, 'PUT', body);
}
