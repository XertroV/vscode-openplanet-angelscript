// string[] testArray = tostring({name, ''+cpCount, ''+lastCpTime, ''+spawnStatus, ''+raceRank, ''+taRank, ''+bestTime});
// // namespace Test {
// //     bool g_test = false;

// //     void Main() {
// //     auto app = GetApp();
// //     }

// //     string name = "anme";

// // }

// enum SpawnStatus {NotSpawned,Spawning,Spawned}

// void Main() {
// }

/*
[Setting hidden name="test"]
dictionary pluginToRaceData
*/


namespace A {
    class B {
        B(const string &in blah) {}
    }

    B@[] x = {B("")};
    auto x2 = {B("")};
    auto x3 = B("");

    B@ mkB() {
        return B("");
    }
}

auto y = A::x;
auto z = A::B('asdf');
auto w = A::mkB();
auto x2 = A::x2;
auto x3 = A::x3;
