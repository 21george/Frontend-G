import { createSlice, configureStore, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'

/* ── Modal slice ───────────────────────────────────────────────────────────── */
interface ModalState {
  activeModal: string | null
  modalProps: Record<string, unknown>
}

const modalSlice = createSlice({
  name: 'modal',
  initialState: { activeModal: null, modalProps: {} } as ModalState,
  reducers: {
    openModal(state, action: PayloadAction<{ id: string; props?: Record<string, unknown> }>) {
      state.activeModal = action.payload.id
      state.modalProps = action.payload.props ?? {}
    },
    closeModal(state) {
      state.activeModal = null
      state.modalProps = {}
    },
  },
})

/* ── Sidebar slice ─────────────────────────────────────────────────────────── */
const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState: { collapsed: false },
  reducers: {
    toggleSidebar(state) { state.collapsed = !state.collapsed },
    setSidebar(state, action: PayloadAction<boolean>) { state.collapsed = action.payload },
  },
})

/* ── Global loading slice ──────────────────────────────────────────────────── */
interface LoadingState {
  operations: Record<string, boolean>
}

const loadingSlice = createSlice({
  name: 'loading',
  initialState: { operations: {} } as LoadingState,
  reducers: {
    setLoading(state, action: PayloadAction<{ key: string; loading: boolean }>) {
      if (action.payload.loading) {
        state.operations[action.payload.key] = true
      } else {
        delete state.operations[action.payload.key]
      }
    },
  },
})

/* ── Store ─────────────────────────────────────────────────────────────────── */
export const uiStore = configureStore({
  reducer: {
    modal: modalSlice.reducer,
    sidebar: sidebarSlice.reducer,
    loading: loadingSlice.reducer,
  },
})

export type UIState = ReturnType<typeof uiStore.getState>
export type UIDispatch = typeof uiStore.dispatch

export const useUIDispatch: () => UIDispatch = useDispatch
export const useUISelector: TypedUseSelectorHook<UIState> = useSelector

/* ── Actions ───────────────────────────────────────────────────────────────── */
export const { openModal, closeModal } = modalSlice.actions
export const { toggleSidebar, setSidebar } = sidebarSlice.actions
export const { setLoading } = loadingSlice.actions

/* ── Selectors ─────────────────────────────────────────────────────────────── */
export const selectActiveModal = (s: UIState) => s.modal.activeModal
export const selectModalProps = (s: UIState) => s.modal.modalProps
export const selectSidebarCollapsed = (s: UIState) => s.sidebar.collapsed
export const selectIsLoading = (key: string) => (s: UIState) => !!s.loading.operations[key]
