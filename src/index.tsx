import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import hljs from 'highlight.js'
import { renderer, Show } from './components'

const app = new Hono()

app.get('*', renderer)

// 初期表示
app.get('/', async (c) => {
  return c.render(<Show />)
})

app.post('/show',
  zValidator(
    'form',
    z.object({
      appId: z.string().min(1),
      fieldNameForPrimaryKey: z.string().optional(),
      fieldNameForParentPrimaryKey: z.string().optional(),
      targetFieldName: z.string().optional(),
      eventsSave: z.string().optional(),
      eventsShow: z.string().optional(),
    })
  ),
  async (c) => {
    const {
      appId = 100,
      fieldNameForPrimaryKey = '子アプリの主キー',
      fieldNameForParentPrimaryKey = '親アプリの主キー',
      targetFieldName = 'primaryKey'
    } = c.req.valid('form')

    const code = `
(function() {
  'use strict';

  // API連携を行いたい任意のタイミングを登録
  const events = [
    // 'app.record.index.edit.submit',
    // 'app.record.detail.show',
    // 'app.record.detail.show',
    'app.record.edit.submit.success' // 保存に成功した後
  ]

  kintone.events.on(events, async function(event) {
    const primaryKey = event.record['${fieldNameForPrimaryKey}'].value; // 検索対象となるキーのフィールド名

    // 1. 更新した弁護士登録番号と一致する活動履歴全レコード取得
    const body = {
      app: kintone.app.getId(),
      query: '${fieldNameForPrimaryKey}=' + primaryKey
    };
    const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', body)

    // 2. 1で取得したレコードの件数で更新
    const updateBody = {
      app: ${appId}, // 全弁護士リストのappId
      updateKey: { // 更新対象を指定する
        field: '${fieldNameForParentPrimaryKey}',
        value: primaryKey
      },
      record: {
        ${targetFieldName}: { // 全弁護士リストに追加した件数表示フィールド名
          value: res.records.length
        }
      }
    };
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateBody);
    return event;
  });
})();
`;

    const highlightedCode = hljs.highlight(code, { language: 'js' }).value
    const html = (
      <html>
      <body>
      <pre>
                    <code dangerouslySetInnerHTML={{__html: highlightedCode}}/>
                </pre>
      </body>
      </html>
    );
    return c.html(
      <div>
        {html}
      </div>
    )
  })

export default app
