import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import hljs from 'highlight.js'
import { renderer, Show } from './components'
import { minify } from 'terser'

const app = new Hono()

app.get('*', renderer)

// 初期表示
app.get('/', async (c) => {
  return c.render(<Show />)
})

// app.get('/add_field', async (c) => {
//   return c.render(
//     <div class="flex gap-4 items-center">
//       <label for="otherCondition" class="form-label">追加条件</label>
//       <input name="otherCondition" type="text"
//              class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5"
//              placeholder='ルックアップ_0=1'
//       />
//     </div>
//   )
// })

function getCodeTemplate(fieldNameForForeignKey: string, queryString: string, appId: string, fieldNameForPrimaryKey: string, targetFieldName: string) {
  return `
(function() {
  'use strict';

  // 1. レコード追加画面で保存に成功した場合
  kintone.events.on(['app.record.create.submit.success'], async function(event) {
    const foreignKey = event.record['${fieldNameForForeignKey}'].value; // 検索対象となるキーのフィールド名

    // 1. 更新した子レコードの外部キーと一致する子アプリ全レコード取得
    const body = {
      app: kintone.app.getId(),
      query: ${queryString}
    };
    const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', body)

    // 2. 1で取得したレコードの件数で更新
    const updateBody = {
      app: ${appId}, // 更新対象アプリのappId
      updateKey: { // 更新対象を指定する
        field: '${fieldNameForPrimaryKey}',
        value: foreignKey
      },
      record: {
        ${targetFieldName}: {
          value: res.records.length
        }
      }
    };
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateBody);
    return event;
  });
  
  // 2. 一覧画面でレコードを削除する前
  kintone.events.on(['app.record.index.delete.submit'], async function(event) {
    const foreignKey = event.record['${fieldNameForForeignKey}'].value; // 検索対象となるキーのフィールド名

    // 1. 更新した子レコードの外部キーと一致する子アプリ全レコード取得
    const body = {
      app: kintone.app.getId(),
      query: ${queryString}
    };
    const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', body)

    // 2. 1で取得したレコードの件数で更新
    const updateBody = {
      app: ${appId}, // 更新対象アプリのappId
      updateKey: { // 更新対象を指定する
        field: '${fieldNameForPrimaryKey}',
        value: foreignKey
      },
      record: {
        ${targetFieldName}: {
          value: res.records.length > 0 ? res.records.length - 1 : 0
        }
      }
    };
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateBody);
    return event;
  });
  
  // 3. 変更前のレコード情報を保持する変数
  let previousAssociationNumber = null;

  kintone.events.on('app.record.edit.show', function(event) {
    previousAssociationNumber = event.record['${fieldNameForForeignKey}'].value;
  });

  kintone.events.on(['app.record.edit.submit.success'], async function(event) {
    const foreignKey = event.record['${fieldNameForForeignKey}'].value; // 検索対象となるキーのフィールド名

    // 変更後の方
    // 1. 自身のアプリから更新した弁護士登録番号と一致する活動履歴全レコード取得
    const body = {
      app: kintone.app.getId(),
      query: ${queryString}
    };
    const res = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', body)

    // 2. 1で取得したレコードの件数で更新
    const updateBody = {
      app: ${appId}, // 更新対象アプリのappId
      updateKey: {
        field: '${fieldNameForPrimaryKey}',
        value: foreignKey
      },
      record: {
        ${targetFieldName}: {
          value: res.records.length
        }
      }
    };
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', updateBody);

    // 変更前の方
    const previousRecordBody = {
      app: kintone.app.getId(),
      query: '${fieldNameForForeignKey}=' + previousAssociationNumber
    };
    const res2 = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', previousRecordBody)

    const preUpdateBody = {
      app: ${appId}, // 更新対象アプリのappId
      updateKey: { // 更新対象を指定する
        field: '${fieldNameForPrimaryKey}',
        value: previousAssociationNumber
      },
      record: {
        ${targetFieldName}: {
          value: res2.records.length
        }
      }
    };
    await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', preUpdateBody);
    return event;
  });
})();
`;
}

app.post('/show',
  zValidator(
    'form',
    z.object({
      appId: z.string().min(1),
      fieldNameForForeignKey: z.string(),
      fieldNameForPrimaryKey: z.string(),
      targetFieldName: z.string(),
      otherCondition: z.string().optional(),
      useMinify: z.string().optional()
    })
  ),
  async (c) => {
    const {
      appId,
      fieldNameForForeignKey ,
      fieldNameForPrimaryKey,
      targetFieldName,
      otherCondition,
      useMinify,
    } = c.req.valid('form')

    let queryString = `'${fieldNameForForeignKey}=' + foreignKey`
    if (otherCondition) {
      queryString += ` + 'and ${otherCondition}'`
    }

    let code = getCodeTemplate(fieldNameForForeignKey, queryString, appId, fieldNameForPrimaryKey, targetFieldName);
    if (useMinify) {
      const result = await minify(code);
      code = String(result.code)
    }

    const highlightedCode = hljs.highlight(code, { language: 'js' }).value
    const html = (
      <html>
      <body>
        <pre style='white-space: pre-wrap'>
          <code dangerouslySetInnerHTML={{__html: highlightedCode}}/>
        </pre>
      </body>
      </html>
    );
    return c.html(
      <div style='max-width: 768px'>
        {html}
      </div>
    )
  })

export default app
