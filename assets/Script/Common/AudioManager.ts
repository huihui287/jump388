/**
 * 声音管理
 */
import { _decorator, AudioSource, AudioClip, Node, resources } from 'cc';

const { ccclass, property } = _decorator;

@ccclass
export default class AudioManager {
    private static mAudioManager: AudioManager;

    static getInstance() {
        if (AudioManager.mAudioManager == null) {
            AudioManager.mAudioManager = new AudioManager();
        }
        return AudioManager.mAudioManager;
    }

    private musicPath: string = null;//当前正在播放的背景音乐
    private musicSource: AudioSource = null;//背景音乐AudioSource组件
    private soundSource: AudioSource = null;//音效AudioSource组件

    private _musicOn: boolean = true;//是否开启播放背景音乐
    private _soundOn: boolean = true;//是否开启播放音效

    private constructor() {
        // 创建音频节点和AudioSource组件
        this.musicSource = new AudioSource();
        this.soundSource = new AudioSource();
        // 设置默认值
        this.musicSource.loop = true;
        this.soundSource.loop = false;
    }

    //播放背景音乐
    async playMusic(path: string, loop: boolean = true, volume = 1) {
        if (!path) {
            return;
        }
        // 如果路径已经是完整URL或包含协议，则不再添加前缀
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('audio/')) {
            // 已经是完整路径，直接使用
        } else {
            path = "audio/" + path;
        }
        try {
            if (this.musicPath != path) {
                await this.loadAudioClip(path, (clip: AudioClip) => {
                    this.musicSource.clip = clip;
                    this.musicSource.loop = loop;
                    this.musicSource.volume = volume;
                    this.musicPath = path;
                    if (this.musicOn) {
                        this.musicSource.play();
                    }
                });
            } else if (this.musicOn && !this.musicSource.playing) {
                this.musicSource.play();
            }
        } catch (e) {
            console.error('Failed to play music:', e);
        }
    }

    private pauseMusic() {
        if (this.musicSource && this.musicSource.playing) {
            this.musicSource.pause();
        }
    }

    private resumeMusic() {
        if (this.musicSource && !this.musicSource.playing && this.musicOn) {
            this.musicSource.play();
        }
    }

    /**
     * 播放音效
     * 
     * @param path 路径
     * @param loop 是否循环
     * @param resolve 播放成功回调
     * @param reject 播放失败回调
     */
    playSoundAsync(path: string, loop: boolean = false, resolve: (value: any) => any, reject: (reason: any) => any) {
        // 如果路径已经是完整URL或包含协议，则不再添加前缀
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('audio/')) {
            // 已经是完整路径，直接使用
        } else {
            path = "audio/" + path;
        }
        if (!path) {
            if (reject) reject(null);
            return;
        }
        if (!this.soundOn) {
            if (resolve) resolve(null);
            return;
        }
        
        this.loadAudioClip(path, (clip: AudioClip) => {
            this.soundSource.clip = clip;
            this.soundSource.loop = loop;
            this.soundSource.play();
            if (resolve) resolve(this.soundSource);
        }, (err) => {
            if (reject) reject(err);
        });
    }

    //播放很短的音效
    async playSound(path: string, loop: boolean = false) {
        // 如果路径已经是完整URL或包含协议，则不再添加前缀
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('audio/')) {
            // 已经是完整路径，直接使用
        } else {
            path = "audio/" + path;
        }
        if (!path) {
            return;
        }
        if (!this.soundOn) {
            return;
        }
        try {
            await this.loadAudioClip(path, (clip: AudioClip) => {
                this.soundSource.clip = clip;
                this.soundSource.loop = loop;
                this.soundSource.play();
            });
            return this.soundSource;
        } catch (e) {
            console.error('Failed to play sound:', e);
        }
    }

    /**
     * 停止播放音效
     * 
     * @param source 音效AudioSource组件
     */
    stopSound(source?: AudioSource) {
        if (source && source.playing) {
            source.stop();
        } else if (this.soundSource.playing) {
            this.soundSource.stop();
        }
    }

    /**
     * 停止播放所有声音
     */
    stopAll() {
        this.musicPath = null;
        if (this.musicSource.playing) {
            this.musicSource.stop();
        }
        if (this.soundSource.playing) {
            this.soundSource.stop();
        }
    }

    /**
     * 加载音频资源
     * 
     * @param path 音频资源路径
     * @param onLoadSuccess 加载成功回调
     * @param onLoadFailed 加载失败回调
     */
    private loadAudioClip(path: string, onLoadSuccess: (clip: AudioClip) => void, onLoadFailed?: (err: any) => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            resources.load(path, AudioClip, (err, clip) => {
                if (!err) {
                    onLoadSuccess(clip);
                    resolve();
                } else {
                    console.error('Failed to load audio clip:', err);
                    if (onLoadFailed) {
                        onLoadFailed(err);
                    }
                    reject(err);
                }
            });
        });
    }

    public set musicOn(on: boolean) {
        if (this._musicOn == on) {
            return;
        }
        this._musicOn = on;
        if (on) {
            this.resumeMusic();
        } else {
            this.pauseMusic();
        }
    }

    public get musicOn(): boolean {
        return this._musicOn;
    }

    public set soundOn(on: boolean) {
        this._soundOn = on;
    }

    public get soundOn(): boolean {
        return this._soundOn;
    }
}
