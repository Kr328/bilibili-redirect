package main

import (
	"bytes"
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"flag"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/samber/lo"
	"golang.org/x/exp/slices"
)

var (
	listenAt  = flag.String("l", "localhost:10808", "Local server listen address")
	servePath = flag.String("p", ".", "Local server root path")
)

//go:embed userscript.js
var userscript []byte

func main() {
	flag.Parse()

	servePath, err := filepath.Abs(*servePath)
	if err != nil {
		panic(err.Error())
	}

	r := chi.NewRouter()
	r.Use(cors.AllowAll().Handler)

	r.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		files, err := os.ReadDir(servePath)
		if err != nil {
			writer.WriteHeader(http.StatusForbidden)
			_, _ = writer.Write([]byte(err.Error()))

			return
		}

		files = lo.Filter(files, func(item os.DirEntry, _ int) bool {
			return !item.IsDir() && (strings.HasSuffix(item.Name(), ".mp4") || strings.HasSuffix(item.Name(), ".flv"))
		})

		slices.SortFunc(files, func(a, b fs.DirEntry) bool {
			aSt, err := a.Info()
			if err != nil {
				println(err.Error())

				return true
			}

			bSt, err := b.Info()
			if err != nil {
				println(err.Error())

				return false
			}

			if aSt.ModTime().After(bSt.ModTime()) {
				return true
			}

			return false
		})

		type File struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		}

		type Files struct {
			Files []*File `json:"files"`
		}

		resp := &Files{
			Files: lo.Map(files, func(item os.DirEntry, index int) *File {
				return &File{
					ID:   base64.URLEncoding.EncodeToString([]byte(item.Name())),
					Name: item.Name(),
				}
			}),
		}

		_ = json.NewEncoder(writer).Encode(resp)
	})
	r.HandleFunc("/bilibili-redirect.user.js", func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Type", "text/javascript")
		writer.WriteHeader(http.StatusOK)
		_, _ = writer.Write(bytes.ReplaceAll(userscript, []byte("%%%SERVER_URL%%%"), []byte("http://"+*listenAt)))
	})
	r.HandleFunc("/{fileId}", func(writer http.ResponseWriter, request *http.Request) {
		fileId, err := base64.URLEncoding.DecodeString(chi.URLParam(request, "fileId"))
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)

			_, _ = writer.Write([]byte(err.Error()))

			return
		}

		fileName := string(fileId)

		if strings.Contains(fileName, "/") {
			writer.WriteHeader(http.StatusBadRequest)

			return
		}

		http.ServeFile(writer, request, filepath.Join(servePath, fileName))
	})

	listener, err := net.Listen("tcp", *listenAt)
	if err != nil {
		panic(err.Error())
	}

	go func() {
		ch := make(chan os.Signal, 1)

		signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)

		<-ch

		_ = listener.Close()
	}()

	servingHost, _, err := net.SplitHostPort(*listenAt)
	_, servingPort, _ := net.SplitHostPort(listener.Addr().String())

	*listenAt = net.JoinHostPort(servingHost, servingPort)

	println("Serve '" + servePath + "' at http://" + *listenAt)
	println("Script at http://" + *listenAt + "/bilibili-redirect.user.js")

	err = http.Serve(listener, r)
	if err != nil {
		println(err.Error())
	}
}
