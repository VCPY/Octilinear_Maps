# Octilinear_Maps

This project is based on the paper [Metro Maps on Octilinear Grid Graphs](https://diglib.eg.org/handle/10.1111/cgf13986) by Bast et al.
The paper proposes an algorithm for drawing public transport maps on an octilinear grid graph. Such a graph allows each edge to be drawn vertically, horizontally or diagonally. Stations are displayed as nodes of the graph. Our implementation of the algorithm takes data in GTFS-Format as input and provides a resulting drawing of the contained lines as output. We provide data of five cities for the graph, however, the users can upload their own files as well. 

## Running
The project can be started either using angular, but since out datasets are quite large the project is best started with the command `node --max_old_space_size=10048 ./node_modules/@angular/cli/bin/ng serve` after navigating to the `src/` directory.

Alternatively the static web files are located in the `bin/`directory. They mus be served using `http-server`  using the command `http-server dist/octilinear-maps/`

Additionaly these files are hosted using github pages [here](https://vcpy.github.io/Octilinear_Maps/).

## Credits
[Fahrplandaten des VVS im GTFS-Format (General Transit Feed Specification)](https://www.openvvs.de/dataset/gtfs-daten/resource/bfbb59c7-767c-4bca-bbb2-d8d32a3e0378)

[Timetable and geodata of the stations in format GTFS (General Transit Feed Specification)](https://www.data.gv.at/katalog/dataset/wiener-linien-fahrplandaten-gtfs-wien)

[Dati del Trasporto Pubblico (GTFS) del Comune di Roma](https://dati.comune.roma.it/catalog/dataset/c_h501-d-9000)