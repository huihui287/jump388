I will integrate the functionality from `DouyinSideBar.ts` into the existing channel management structure (`TTCH.ts` and `BaseCH.ts`) and `ChannelDB`, then remove the redundant file.

### 1. Update `ChannelDB.ts` & `BaseCH.ts`
*   **Goal**: Ensure global state management for "Source Scene" (to detect if user came from Sidebar) is updated not just on launch, but also when returning to foreground.
*   **Action**: 
    *   Modify `BaseCH.onShowAlways` to update `ChannelDB.sourceScene` when `onShow` triggers. This ensures `ChannelDB` always reflects the latest entry source.
    *   (Already done in previous step) `BaseCH` already has `checkSideBar` and `navigateToSideBar` stubs.

### 2. Implement Logic in `TTCH.ts` (Toutiao Channel)
*   **Goal**: Move the specific Douyin API calls from `DouyinSideBar` to the `TTCH` class.
*   **Action**:
    *   **Override `checkSideBar(callback)`**: Implement using `tt.checkScene`.
    *   **Override `navigateToSideBar(callback)`**: Implement using `tt.navigateToScene`.
    *   **Enhance `onShowAlways`**: In addition to updating `sourceScene`, add the `director.resume()` fix specific to Douyin sidebar restoration (from original `DouyinSideBar.ts`).

### 3. Update `GuideView.ts`
*   **Goal**: Decouple from the deleted file.
*   **Action**: Change the call from `DouyinSideBar.navigateToDouyin` to `CM.mainCH.navigateToSideBar`.

### 4. Cleanup
*   **Action**: Delete `assets/Script/channel/script/DouyinSideBar.ts` as its logic is now fully integrated into the architecture.

### 5. Verification
*   **Action**: Verify `TTCH` methods are correctly implemented and `GuideView` references are updated.

This plan strictly follows your "existing channel direction" by placing platform-specific logic in the platform-specific class (`TTCH`) and using the central manager (`CM`) for access.