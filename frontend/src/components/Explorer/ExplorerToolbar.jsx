import { Button } from '@react95/core'
import { Progman44, Progman45, Wmsui322226, Mshtml32528, Shdocvw260, Progman37 } from '@react95/icons'
import Separator from '../Separator'

function ExplorerToolbar({ item }) {
  const fakeUrl = `www.${item.title.toLowerCase().replace(/\s+/g, '')}.geocities.com`

  return (
    <div style={{ padding: '4px 0' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Button>
          <Progman44 variant="32x32_4"/>
          <br />
          Back
        </Button>
        <Button>
          <Progman45 variant="32x32_4"/>
          <br />
          Forward
        </Button>
        <Button>
          <Wmsui322226 variant="32x32_4"/>
          <br />
          Refresh
        </Button>
        <Separator orientation='vertical' />
        <Button>
          <Mshtml32528 variant="32x32_8"/>
          <br />
          Search
        </Button>
        <Button>
          <Shdocvw260 variant="32x32_4"/>
          <br />
          Favorites
        </Button>
        <Separator orientation='vertical' />
        <Button>
          <Progman37 variant="32x32_4"/>
          <br />
          Help
        </Button>
      </div>


      <div
        className="win95-sunken"
        style={{ padding: '3px 6px', fontSize: 12, fontFamily: 'monospace' }}
      >
        Address: {fakeUrl}
      </div>
    </div>
  )
}

export default ExplorerToolbar