import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist, 
} from "../controllers/playlist.controllers.js"
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { checkOwnership } from '../middlewares/checkOwnership.middlewares.js';
import { Playlist } from '../models/playlist.models.js';


const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/create").post(createPlaylist)

router.route("/:playlistId").get(getPlaylistById)

router.route("/update/:playlistId").patch( checkOwnership(Playlist,"owner","playlistId")  ,updatePlaylist)
router.route("/delete/:playlistId").delete(checkOwnership(Playlist, "owner", "playlistId"),deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(checkOwnership(Playlist, "owner", "playlistId"),addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(checkOwnership(Playlist, "owner", "playlistId"),removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router