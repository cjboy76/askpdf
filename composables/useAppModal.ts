import { STATE_KEY } from '~/share'

export const useAppModal = () => {
  const isFileModalOpen = useState(STATE_KEY.IS_FILE_UPLOADING, () => false)
  const isSettingModalOpen = useState(STATE_KEY.TOGGLE_SETTING_MODAL, () => false)
  const isClearDataConfirmModalOpen = useState(STATE_KEY.TOGGLE_CLEAR_DATA_MODAL, () => false)
  return {
    isFileModalOpen,
    isSettingModalOpen,
    isClearDataConfirmModalOpen,
  }
}
