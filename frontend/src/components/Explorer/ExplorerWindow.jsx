import { Frame, TitleBar } from '@react95/core'
import ExplorerToolbar from './ExplorerToolbar'
import ContentFrame from './ContentFrame'
import Separator from '../Separator'

function ExplorerWindow({ item, onClose, style }) {
  return (
    <Frame
      w="800px"
      bgColor="$material"
      boxShadow="$out"
      padding="$2"
      style={{ position: 'absolute', ...style }}
    >
      <TitleBar title={item.title}>
        <TitleBar.OptionsBox>
          <TitleBar.Close onClick={onClose} />
        </TitleBar.OptionsBox>
      </TitleBar>

      <Separator />
      <ExplorerToolbar item={item} />
      <Separator />
      <ContentFrame item={item} />
    </Frame>
  )
}

export default ExplorerWindow