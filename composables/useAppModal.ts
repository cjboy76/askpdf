const isFileModalOpen = useState('toggle-file-modal', () => false)
const isSettingModalOpen = useState('toggle-setting-modal', () => false)

export const useAppModal =() => {
    return {
        isFileModalOpen,
        isSettingModalOpen
    }
}