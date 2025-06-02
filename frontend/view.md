
các api của tôi 
/api/stats/movies/:id

trả về dạng như dưới 
{
    "movie": {
        "id": 1,
        "title": "Chậm Một Bước Để Cả Đời Bên Nhau",
        "totalViews": 10000
    },
    "episodeStats": [
        {
            "id": 1,
            "episodeNumber": 1,
            "views": 0
        },
        {
            "id": 2,
            "episodeNumber": 2,
            "views": 0
        },
        {
            "id": 3,
            "episodeNumber": 3,
            "views": 0
        },
        {
            "id": 4,
            "episodeNumber": 4,
            "views": 0
        },
        {
            "id": 5,
            "episodeNumber": 5,
            "views": 0
        },
        {
            "id": 6,
            "episodeNumber": 6,
            "views": 0
        }
    ],
    "totalEpisodeViews": 0,
}

/api/stats/episodes/:id
trả về


{
    "episode": {
        "id": 1,
        "movieId": 1,
        "episodeNumber": 1,
        "title": "Chậm Một Bước Để Cả Đời Bên Nhau",
        "totalViews": 0
    },
    "dailyViews": [],
    "hourlyViews": [],
    "percentOfMovieViews": 0
}

/api/stats/movies/top?limit=12

[
    {
        "id": 1,
        "title": "Chậm Một Bước Để Cả Đời Bên Nhau",
        "views": 10000,
        "posterUrl": "https://media.alldrama.tech/movies/1/poster.png"
    },
    {
        "id": 2,
        "title": "Chim Hoàng Yến Của Tổng Tài",
        "views": 10000,
        "posterUrl": "https://media.alldrama.tech/movies/2/poster.png"
    },
    {
        "id": 3,
        "title": "Âm Thầm Bên Em",
        "views": 1023,
        "posterUrl": "https://media.alldrama.tech/movies/3/poster.png"
    }
]

/api/stats/episodes/top?limit=10

trả về

[
    {
        "id": 7,
        "episodeNumber": 1,
        "views": 0,
        "movieId": 2,
        "movie": {
            "title": "Chim Hoàng Yến Của Tổng Tài",
            "posterUrl": "https://media.alldrama.tech/movies/2/poster.png"
        }
    },
    {
        "id": 8,
        "episodeNumber": 2,
        "views": 0,
        "movieId": 2,
        "movie": {
            "title": "Chim Hoàng Yến Của Tổng Tài",
            "posterUrl": "https://media.alldrama.tech/movies/2/poster.png"
        }
    }
]

/api/views/movie/:movieId

{
    "success": true,
    "message": "Đã tăng lượt xem cho phim"
}

/api/views/episode/:episodeId

{
    "success": true,
    "message": "Đã tăng lượt xem cho tập phim"
}

